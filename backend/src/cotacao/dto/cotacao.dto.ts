import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsUUID, 
  IsEnum, 
  IsNumber, 
  IsDate, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  Min, 
  Max,
  IsEmail,
  IsBoolean,
  ArrayMinSize,
  Length
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { StatusCotacao, PrioridadeCotacao, OrigemCotacao } from '../entities/cotacao.entity';

// DTOs para itens
export class CriarItemCotacaoDto {
  @ApiProperty({ description: 'Descrição do item' })
  @IsString()
  @Length(1, 500)
  descricao: string;

  @ApiProperty({ description: 'Quantidade do item' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantidade: number;

  @ApiProperty({ description: 'Unidade de medida' })
  @IsString()
  @Length(1, 20)
  unidade: string;

  @ApiProperty({ description: 'Valor unitário' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorUnitario: number;

  @ApiPropertyOptional({ description: 'Observações do item' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Código do produto' })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({ description: 'Categoria do item' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Desconto em percentual' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  desconto?: number;

  @ApiPropertyOptional({ description: 'Alíquota de imposto em percentual' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  aliquotaImposto?: number;

  @ApiPropertyOptional({ description: 'Prazo de entrega em dias' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prazoEntregaDias?: number;

  @ApiPropertyOptional({ description: 'Especificações técnicas' })
  @IsOptional()
  especificacoes?: Record<string, any>;
}

export class ItemCotacaoResponseDto extends CriarItemCotacaoDto {
  @ApiProperty({ description: 'ID do item' })
  id: string;

  @ApiProperty({ description: 'Valor total do item' })
  valorTotal: number;

  @ApiProperty({ description: 'Valor do desconto' })
  valorDesconto: number;

  @ApiProperty({ description: 'Valor do imposto' })
  valorImposto: number;

  @ApiProperty({ description: 'Valor líquido' })
  valorLiquido: number;

  @ApiProperty({ description: 'Data de criação' })
  dataCriacao: Date;
}

// DTO principal para criar cotação
export class CriarCotacaoDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  clienteId: string;

  @ApiProperty({ description: 'Título da cotação' })
  @IsString()
  @Length(1, 200)
  titulo: string;

  @ApiPropertyOptional({ description: 'Descrição da cotação' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ description: 'Prioridade', enum: PrioridadeCotacao })
  @IsEnum(PrioridadeCotacao)
  prioridade: PrioridadeCotacao;

  @ApiProperty({ description: 'Data de vencimento' })
  @Type(() => Date)
  @IsDate()
  dataVencimento: Date;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Condições de pagamento' })
  @IsOptional()
  @IsString()
  condicoesPagamento?: string;

  @ApiPropertyOptional({ description: 'Prazo de entrega' })
  @IsOptional()
  @IsString()
  prazoEntrega?: string;

  @ApiPropertyOptional({ description: 'Validade do orçamento em dias' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  validadeOrcamento?: number;

  @ApiProperty({ description: 'Origem da cotação', enum: OrigemCotacao })
  @IsEnum(OrigemCotacao)
  origem: OrigemCotacao;

  @ApiProperty({ description: 'Itens da cotação', type: [CriarItemCotacaoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriarItemCotacaoDto)
  itens: CriarItemCotacaoDto[];
}

// DTO para atualizar cotação
export class AtualizarCotacaoDto {
  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'Título da cotação' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  titulo?: string;

  @ApiPropertyOptional({ description: 'Descrição da cotação' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ description: 'Prioridade', enum: PrioridadeCotacao })
  @IsOptional()
  @IsEnum(PrioridadeCotacao)
  prioridade?: PrioridadeCotacao;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataVencimento?: Date;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Condições de pagamento' })
  @IsOptional()
  @IsString()
  condicoesPagamento?: string;

  @ApiPropertyOptional({ description: 'Prazo de entrega' })
  @IsOptional()
  @IsString()
  prazoEntrega?: string;

  @ApiPropertyOptional({ description: 'Validade do orçamento em dias' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  validadeOrcamento?: number;

  @ApiPropertyOptional({ description: 'Itens da cotação', type: [CriarItemCotacaoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriarItemCotacaoDto)
  itens?: CriarItemCotacaoDto[];
}

// DTO para consultas
export class CotacaoQueryDto {
  @ApiPropertyOptional({ description: 'Página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Campo para ordenação' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  orderDirection?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Busca global' })
  @IsOptional()
  @IsString()
  busca?: string;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'Status da cotação', enum: StatusCotacao })
  @IsOptional()
  @IsEnum(StatusCotacao)
  status?: StatusCotacao | StatusCotacao[];

  @ApiPropertyOptional({ description: 'Prioridade', enum: PrioridadeCotacao })
  @IsOptional()
  @IsEnum(PrioridadeCotacao)
  prioridade?: PrioridadeCotacao;

  @ApiPropertyOptional({ description: 'ID do responsável' })
  @IsOptional()
  @IsUUID()
  responsavelId?: string;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @ApiPropertyOptional({ description: 'Data de fim' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;

  @ApiPropertyOptional({ description: 'Data de vencimento início' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataVencimentoInicio?: Date;

  @ApiPropertyOptional({ description: 'Data de vencimento fim' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataVencimentoFim?: Date;

  @ApiPropertyOptional({ description: 'Valor mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorMinimo?: number;

  @ApiPropertyOptional({ description: 'Valor máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorMaximo?: number;
}

// DTO para alterar status
export class AlterarStatusDto {
  @ApiProperty({ description: 'Novo status', enum: StatusCotacao })
  @IsEnum(StatusCotacao)
  status: StatusCotacao;

  @ApiPropertyOptional({ description: 'Observação sobre a alteração' })
  @IsOptional()
  @IsString()
  observacao?: string;
}

// DTO para duplicar cotação
export class DuplicarCotacaoDto {
  @ApiPropertyOptional({ description: 'Novo título' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  titulo?: string;

  @ApiPropertyOptional({ description: 'ID do cliente (se diferente)' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'Nova data de vencimento' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataVencimento?: Date;

  @ApiPropertyOptional({ description: 'Novas observações' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

// DTO para envio de email
export class EnviarEmailDto {
  @ApiProperty({ description: 'Lista de destinatários' })
  @IsArray()
  @IsEmail({}, { each: true })
  destinatarios: string[];

  @ApiPropertyOptional({ description: 'Assunto do email' })
  @IsOptional()
  @IsString()
  assunto?: string;

  @ApiPropertyOptional({ description: 'Mensagem do email' })
  @IsOptional()
  @IsString()
  mensagem?: string;

  @ApiPropertyOptional({ description: 'Incluir PDF da cotação' })
  @IsOptional()
  @IsBoolean()
  incluirPDF?: boolean;

  @ApiPropertyOptional({ description: 'Cópia para o remetente' })
  @IsOptional()
  @IsBoolean()
  copiaParaRemetente?: boolean;
}

// DTO de resposta da cotação
export class CotacaoResponseDto {
  @ApiProperty({ description: 'ID da cotação' })
  id: string;

  @ApiProperty({ description: 'Número da cotação' })
  numero: string;

  @ApiProperty({ description: 'Título da cotação' })
  titulo: string;

  @ApiPropertyOptional({ description: 'Descrição da cotação' })
  descricao?: string;

  @ApiProperty({ description: 'Status', enum: StatusCotacao })
  status: StatusCotacao;

  @ApiProperty({ description: 'Prioridade', enum: PrioridadeCotacao })
  prioridade: PrioridadeCotacao;

  @ApiProperty({ description: 'Valor total' })
  valorTotal: number;

  @ApiProperty({ description: 'Data de vencimento' })
  dataVencimento: Date;

  @ApiPropertyOptional({ description: 'Observações' })
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Condições de pagamento' })
  condicoesPagamento?: string;

  @ApiPropertyOptional({ description: 'Prazo de entrega' })
  prazoEntrega?: string;

  @ApiPropertyOptional({ description: 'Validade do orçamento' })
  validadeOrcamento?: number;

  @ApiProperty({ description: 'Origem', enum: OrigemCotacao })
  origem: OrigemCotacao;

  @ApiProperty({ description: 'ID do cliente' })
  clienteId: string;

  @ApiPropertyOptional({ description: 'Dados do cliente' })
  cliente?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };

  @ApiProperty({ description: 'ID do responsável' })
  responsavelId: string;

  @ApiPropertyOptional({ description: 'Dados do responsável' })
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };

  @ApiProperty({ description: 'Itens da cotação', type: [ItemCotacaoResponseDto] })
  itens: ItemCotacaoResponseDto[];

  @ApiPropertyOptional({ description: 'Anexos da cotação' })
  anexos?: Array<{
    id: string;
    nome: string;
    tipo: string;
    url: string;
    tamanho: number;
    dataCriacao: Date;
  }>;

  @ApiProperty({ description: 'Data de criação' })
  dataCriacao: Date;

  @ApiProperty({ description: 'Data de atualização' })
  dataAtualizacao: Date;

  @ApiPropertyOptional({ description: 'Data de envio' })
  dataEnvio?: Date;

  @ApiPropertyOptional({ description: 'Data de aprovação' })
  dataAprovacao?: Date;

  @ApiPropertyOptional({ description: 'Data de rejeição' })
  dataRejeicao?: Date;

  @ApiPropertyOptional({ description: 'Data de conversão' })
  dataConversao?: Date;

  @ApiProperty({ description: 'Criado por' })
  criadoPor: string;

  @ApiProperty({ description: 'Atualizado por' })
  atualizadoPor: string;
}
