import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  IsNotEmpty,
  Min,
  Max,
  IsUUID,
  MaxLength,
  MinLength,
  IsEmail,
  Matches,
  IsBoolean,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';
import {
  EstagioOportunidade,
  PrioridadeOportunidade,
  OrigemOportunidade,
  MotivoPerdaOportunidade,
  LifecycleStatusOportunidade,
} from '../oportunidade.entity';

// ✅ Validação customizada: Exige cliente_id OU nomeContato
@ValidatorConstraint({ name: 'RequireClienteOuContato', async: false })
export class RequireClienteOuContatoConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const dto = args.object as {
      cliente_id?: string | null;
      nomeContato?: string | null;
    };
    const clienteId = typeof dto.cliente_id === 'string' ? dto.cliente_id.trim() : '';
    const nomeContato = typeof dto.nomeContato === 'string' ? dto.nomeContato.trim() : '';
    return Boolean(clienteId || nomeContato);
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Informe um cliente (cliente_id) ou pelo menos o nome do contato (nomeContato)';
  }
}

export class CreateOportunidadeDto {
  @IsString({ message: 'Título deve ser uma string' })
  @MinLength(3, { message: 'Título deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'Título muito longo (máximo 255 caracteres)' })
  titulo: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(5000, { message: 'Descrição muito longa (máximo 5000 caracteres)' })
  descricao?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Valor deve ser um número com até 2 casas decimais' },
  )
  @Min(0, { message: 'Valor não pode ser negativo' })
  @Max(999999999.99, { message: 'Valor muito alto (máximo 999.999.999,99)' })
  valor: number;

  @IsNumber({}, { message: 'Probabilidade deve ser um número' })
  @Min(0, { message: 'Probabilidade mínima é 0%' })
  @Max(100, { message: 'Probabilidade máxima é 100%' })
  probabilidade: number;

  @IsEnum(EstagioOportunidade, { message: 'Estágio inválido' })
  estagio: EstagioOportunidade;

  @IsEnum(PrioridadeOportunidade, { message: 'Prioridade inválida' })
  prioridade: PrioridadeOportunidade;

  @IsEnum(OrigemOportunidade, { message: 'Origem inválida' })
  origem: OrigemOportunidade;

  @IsOptional()
  @IsArray({ message: 'Tags deve ser um array' })
  @IsString({ each: true, message: 'Cada tag deve ser uma string' })
  @MaxLength(50, { each: true, message: 'Tag muito longa (máximo 50 caracteres)' })
  tags?: string[];

  @IsOptional()
  @IsDateString({}, { message: 'Data de fechamento esperado inválida (formato ISO: YYYY-MM-DD)' })
  dataFechamentoEsperado?: string;

  @IsString({ message: 'ID do responsável deve ser uma string' })
  @IsUUID('4', { message: 'ID do responsável inválido (deve ser UUID v4)' })
  responsavel_id: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente inválido (deve ser UUID v4)' })
  cliente_id?: string;

  // Campos de contato (quando não há cliente)
  @IsOptional()
  @IsString({ message: 'Nome do contato deve ser uma string' })
  @MinLength(3, { message: 'Nome do contato deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'Nome do contato muito longo (máximo 255 caracteres)' })
  nomeContato?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail do contato inválido' })
  @MaxLength(255, { message: 'E-mail do contato muito longo (máximo 255 caracteres)' })
  emailContato?: string;

  @IsOptional()
  @IsString({ message: 'Telefone do contato deve ser uma string' })
  @MaxLength(20, { message: 'Telefone do contato muito longo (máximo 20 caracteres)' })
  @Matches(/^[0-9+\-() ]+$/, {
    message: 'Telefone do contato inválido (apenas números e símbolos)',
  })
  telefoneContato?: string;

  @IsOptional()
  @IsString({ message: 'Empresa do contato deve ser uma string' })
  @MaxLength(255, { message: 'Empresa do contato muito longa (máximo 255 caracteres)' })
  empresaContato?: string;

  // Executa validacao cruzada mesmo com campos opcionais omitidos.
  @Validate(RequireClienteOuContatoConstraint)
  private readonly _clienteOuContatoRule!: boolean;
}

export class UpdateOportunidadeDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probabilidade?: number;

  @IsOptional()
  @IsEnum(EstagioOportunidade)
  estagio?: EstagioOportunidade;

  @IsOptional()
  @IsEnum(PrioridadeOportunidade)
  prioridade?: PrioridadeOportunidade;

  @IsOptional()
  @IsEnum(OrigemOportunidade)
  origem?: OrigemOportunidade;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  dataFechamentoEsperado?: string;

  @IsOptional()
  @IsString()
  responsavel_id?: string;

  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @IsOptional()
  @IsString({ message: 'Nome do contato deve ser uma string' })
  @MinLength(3, { message: 'Nome do contato deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'Nome do contato muito longo (maximo 255 caracteres)' })
  nomeContato?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail do contato invalido' })
  @MaxLength(255, { message: 'E-mail do contato muito longo (maximo 255 caracteres)' })
  emailContato?: string;

  @IsOptional()
  @IsString({ message: 'Telefone do contato deve ser uma string' })
  @MaxLength(20, { message: 'Telefone do contato muito longo (maximo 20 caracteres)' })
  @Matches(/^[0-9+\-() ]+$/, {
    message: 'Telefone do contato invalido (apenas numeros e simbolos)',
  })
  telefoneContato?: string;

  @IsOptional()
  @IsString({ message: 'Empresa do contato deve ser uma string' })
  @MaxLength(255, { message: 'Empresa do contato muito longa (maximo 255 caracteres)' })
  empresaContato?: string;
}

export class UpdateEstagioDto {
  @IsEnum(EstagioOportunidade)
  estagio: EstagioOportunidade;

  @IsOptional()
  @IsBoolean()
  forcarTransicao?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  justificativaForcamento?: string;

  @IsOptional()
  @IsDateString()
  dataFechamentoReal?: string;

  @IsOptional()
  @IsEnum(MotivoPerdaOportunidade)
  motivoPerda?: MotivoPerdaOportunidade;

  @IsOptional()
  @IsString()
  motivoPerdaDetalhes?: string;

  @IsOptional()
  @IsString()
  concorrenteNome?: string;

  @IsOptional()
  @IsDateString()
  dataRevisao?: string;
}

export class CreateOportunidadeItemPreliminarDto {
  @IsOptional()
  @IsUUID('4')
  produto_id?: string | null;

  @IsOptional()
  @IsUUID('4')
  catalog_item_id?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome_snapshot: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku_snapshot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descricao_snapshot?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_unitario_estimado: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantidade_estimada: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  desconto_percentual?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  origem?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ordem?: number;
}

export class UpdateOportunidadeItemPreliminarDto {
  @IsOptional()
  @IsUUID('4')
  produto_id?: string | null;

  @IsOptional()
  @IsUUID('4')
  catalog_item_id?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome_snapshot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku_snapshot?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descricao_snapshot?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_unitario_estimado?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantidade_estimada?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  desconto_percentual?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  origem?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ordem?: number;
}

export class AddOportunidadeVendedorEnvolvidoDto {
  @IsUUID('4', { message: 'ID do vendedor invalido (deve ser UUID v4)' })
  vendedor_id: string;

  @IsOptional()
  @IsString({ message: 'Papel do vendedor deve ser uma string' })
  @MaxLength(40, { message: 'Papel do vendedor muito longo (maximo 40 caracteres)' })
  papel?: string;
}

export enum LifecycleViewOportunidade {
  OPEN = 'open',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  ALL_ACTIVE = 'all_active',
  ALL = 'all',
}

export class MetricasQueryDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsEnum(LifecycleStatusOportunidade)
  lifecycle_status?: LifecycleStatusOportunidade;

  @IsOptional()
  @IsEnum(LifecycleViewOportunidade)
  lifecycle_view?: LifecycleViewOportunidade;

  @IsOptional()
  @IsString()
  include_deleted?: string | boolean;
}

export class OportunidadesListQueryDto {
  @IsOptional()
  @IsEnum(EstagioOportunidade)
  estagio?: EstagioOportunidade;

  @IsOptional()
  @IsString()
  responsavel_id?: string;

  @IsOptional()
  @IsString()
  cliente_id?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsEnum(LifecycleStatusOportunidade)
  lifecycle_status?: LifecycleStatusOportunidade;

  @IsOptional()
  @IsEnum(LifecycleViewOportunidade)
  lifecycle_view?: LifecycleViewOportunidade;

  @IsOptional()
  @IsString()
  include_deleted?: string | boolean;
}

export class LifecycleTransitionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  comentario?: string;
}

export class UpdateLifecycleFeatureFlagDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;
}

export class StaleDealsQueryDto {
  @IsOptional()
  @IsString()
  threshold_days?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class UpdateStalePolicyDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(120)
  thresholdDays?: number;

  @IsOptional()
  @IsBoolean()
  autoArchiveEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(365)
  autoArchiveAfterDays?: number;
}

export class UpdateEngagementPolicyDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  hotMinProbability?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  hotCloseWindowDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  nextActionDueSoonDays?: number;
}

export class UpdateSalesFeatureFlagsDto {
  @IsOptional()
  @IsBoolean()
  pipelineDraftWithoutPlaceholder?: boolean;

  @IsOptional()
  @IsBoolean()
  opportunityPreliminaryItems?: boolean;

  @IsOptional()
  @IsBoolean()
  strictPropostaTransitions?: boolean;

  @IsOptional()
  @IsBoolean()
  discountPolicyPerTenant?: boolean;
}

