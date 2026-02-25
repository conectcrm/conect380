import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  Min,
  Max,
  IsUUID,
  MaxLength,
  MinLength,
  IsEmail,
  Matches,
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
} from '../oportunidade.entity';

// ✅ Validação customizada: Exige cliente_id OU nomeContato
@ValidatorConstraint({ name: 'RequireClienteOuContato', async: false })
export class RequireClienteOuContatoConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const dto = args.object as CreateOportunidadeDto;
    // Válido se tem cliente_id OU nomeContato preenchido
    return !!(dto.cliente_id || (dto.nomeContato && dto.nomeContato.trim()));
  }

  defaultMessage(args: ValidationArguments) {
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
  @Validate(RequireClienteOuContatoConstraint) // ✅ Validação customizada
  cliente_id?: string;

  // Campos de contato (quando não há cliente)
  @IsOptional()
  @IsString({ message: 'Nome do contato deve ser uma string' })
  @MinLength(3, { message: 'Nome do contato deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'Nome do contato muito longo (máximo 255 caracteres)' })
  @Validate(RequireClienteOuContatoConstraint) // ✅ Validação customizada
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
  @IsString()
  nomeContato?: string;

  @IsOptional()
  @IsString()
  emailContato?: string;

  @IsOptional()
  @IsString()
  telefoneContato?: string;

  @IsOptional()
  @IsString()
  empresaContato?: string;
}

export class UpdateEstagioDto {
  @IsEnum(EstagioOportunidade)
  estagio: EstagioOportunidade;

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

export class MetricasQueryDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
