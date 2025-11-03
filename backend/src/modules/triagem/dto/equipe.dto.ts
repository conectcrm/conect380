import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  Matches,
} from "class-validator";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ========================================================================
// DTOs para EQUIPES
// ========================================================================

export class CreateEquipeDto {
  @IsString()
  @IsNotEmpty({ message: "O nome da equipe é obrigatório" })
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  cor?: string; // hex color (padrão: #3B82F6)

  @IsString()
  @IsOptional()
  icone?: string; // nome do ícone (padrão: users)

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class UpdateEquipeDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  cor?: string;

  @IsString()
  @IsOptional()
  icone?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

// ========================================================================
// DTOs para MEMBROS DA EQUIPE
// ========================================================================

export enum FuncaoEquipe {
  LIDER = "lider",
  MEMBRO = "membro",
  SUPERVISOR = "supervisor",
}

export class AdicionarAtendenteEquipeDto {
  @Matches(UUID_PATTERN, {
    message: "O ID do atendente deve estar no formato UUID",
  })
  @IsNotEmpty({ message: "O ID do atendente é obrigatório" })
  atendenteId: string;

  @IsEnum(FuncaoEquipe)
  @IsOptional()
  funcao?: FuncaoEquipe;
}

export class RemoverAtendenteEquipeDto {
  @Matches(UUID_PATTERN, {
    message: "O ID do atendente deve estar no formato UUID",
  })
  @IsNotEmpty({ message: "O ID do atendente é obrigatório" })
  atendenteId: string;
}

// ========================================================================
// DTOs para ATRIBUIÇÕES DE ATENDENTE
// ========================================================================

export class AtribuirAtendenteDto {
  @Matches(UUID_PATTERN, {
    message: "O ID do atendente deve estar no formato UUID",
  })
  @IsNotEmpty({ message: "O ID do atendente é obrigatório" })
  atendenteId: string;

  @IsOptional()
  @Matches(UUID_PATTERN, {
    message: "O ID do núcleo deve estar no formato UUID",
  })
  nucleoId?: string;

  @IsOptional()
  @Matches(UUID_PATTERN, {
    message: "O ID do departamento deve estar no formato UUID",
  })
  departamentoId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  prioridade?: number;
}

export class RemoverAtribuicaoAtendenteDto {
  @Matches(UUID_PATTERN, {
    message: "O ID da atribuição deve estar no formato UUID",
  })
  @IsNotEmpty({ message: "O ID da atribuição é obrigatório" })
  atribuicaoId: string;
}

// ========================================================================
// DTOs para ATRIBUIÇÕES DE EQUIPE
// ========================================================================

export class AtribuirEquipeDto {
  @Matches(UUID_PATTERN, {
    message: "O ID da equipe deve estar no formato UUID",
  })
  @IsNotEmpty({ message: "O ID da equipe é obrigatório" })
  equipeId: string;

  @IsOptional()
  @Matches(UUID_PATTERN, {
    message: "O ID do núcleo deve estar no formato UUID",
  })
  nucleoId?: string;

  @IsOptional()
  @Matches(UUID_PATTERN, {
    message: "O ID do departamento deve estar no formato UUID",
  })
  departamentoId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  prioridade?: number;
}

export class RemoverAtribuicaoEquipeDto {
  @Matches(UUID_PATTERN, {
    message: "O ID da atribuição deve estar no formato UUID",
  })
  @IsNotEmpty({ message: "O ID da atribuição é obrigatório" })
  atribuicaoId: string;
}

// ========================================================================
// DTOs para CONSULTAS
// ========================================================================

export class BuscarAtendentesDisponiveisDto {
  @Matches(UUID_PATTERN, {
    message: "O ID do núcleo deve estar no formato UUID",
  })
  @IsNotEmpty({ message: "O ID do núcleo é obrigatório" })
  nucleoId: string;

  @IsOptional()
  @Matches(UUID_PATTERN, {
    message: "O ID do departamento deve estar no formato UUID",
  })
  departamentoId?: string;
}
