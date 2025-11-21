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
  Length,
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

// DTO principal para criar cotação de aquisição
export class CriarCotacaoDto {
  @ApiProperty({ description: 'ID do fornecedor' })
  @IsUUID()
  fornecedorId: string;

  @ApiProperty({ description: 'Título da solicitação de cotação' })
  @IsString()
  @Length(1, 200)
  titulo: string;

  @ApiPropertyOptional({ description: 'Descrição da solicitação' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ description: 'Prioridade', enum: PrioridadeCotacao })
  @IsEnum(PrioridadeCotacao)
  prioridade: PrioridadeCotacao;

  @ApiPropertyOptional({ description: 'Prazo máximo para resposta da cotação' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  prazoResposta?: Date;

  @ApiPropertyOptional({ description: 'Prazo de entrega esperado' })
  @IsOptional()
  @IsString()
  prazoEntrega?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Condições de pagamento' })
  @IsOptional()
  @IsString()
  condicoesPagamento?: string;

  @ApiPropertyOptional({ description: 'Validade do orçamento em dias' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  validadeOrcamento?: number;

  @ApiProperty({ description: 'Origem da cotação', enum: OrigemCotacao })
  @IsEnum(OrigemCotacao)
  origem: OrigemCotacao;

  @ApiPropertyOptional({ description: 'ID do usuário responsável pela aprovação' })
  @IsOptional()
  @IsUUID()
  aprovadorId?: string;

  @ApiProperty({ description: 'Itens da cotação', type: [CriarItemCotacaoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriarItemCotacaoDto)
  itens: CriarItemCotacaoDto[];
}

// DTO para atualizar cotação de aquisição
export class AtualizarCotacaoDto {
  @ApiPropertyOptional({ description: 'ID do fornecedor' })
  @IsOptional()
  @IsUUID()
  fornecedorId?: string;

  @ApiPropertyOptional({ description: 'Título da solicitação de cotação' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  titulo?: string;

  @ApiPropertyOptional({ description: 'Descrição da solicitação' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ description: 'Prioridade', enum: PrioridadeCotacao })
  @IsOptional()
  @IsEnum(PrioridadeCotacao)
  prioridade?: PrioridadeCotacao;

  @ApiPropertyOptional({ description: 'Prazo máximo para resposta da cotação' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  prazoResposta?: Date;

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

  @ApiPropertyOptional({ description: 'Local de entrega' })
  @IsOptional()
  @IsString()
  localEntrega?: string;

  @ApiPropertyOptional({ description: 'Validade do orçamento em dias' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  validadeOrcamento?: number;

  @ApiPropertyOptional({ description: 'ID do usuário aprovador' })
  @IsOptional()
  @IsUUID()
  aprovadorId?: string;

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

  @ApiPropertyOptional({ description: 'ID do fornecedor' })
  @IsOptional()
  @IsUUID()
  fornecedorId?: string;

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

  @ApiPropertyOptional({ description: 'ID do fornecedor (se diferente)' })
  @IsOptional()
  @IsUUID()
  fornecedorId?: string;

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

// DTO de resposta da cotação de aquisição
export class CotacaoResponseDto {
  @ApiProperty({ description: 'ID da cotação' })
  id: string;

  @ApiProperty({ description: 'Número da cotação' })
  numero: string;

  @ApiProperty({ description: 'Título da solicitação de cotação' })
  titulo: string;

  @ApiPropertyOptional({ description: 'Descrição da solicitação' })
  descricao?: string;

  @ApiProperty({ description: 'Status', enum: StatusCotacao })
  status: StatusCotacao;

  @ApiProperty({ description: 'Prioridade', enum: PrioridadeCotacao })
  prioridade: PrioridadeCotacao;

  @ApiProperty({ description: 'Valor total' })
  valorTotal: number;

  @ApiPropertyOptional({ description: 'Prazo máximo para resposta da cotação' })
  prazoResposta?: Date;

  @ApiPropertyOptional({ description: 'Data de vencimento (alias para prazoResposta)' })
  dataVencimento?: Date;

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

  @ApiProperty({ description: 'ID do fornecedor' })
  fornecedorId: string;

  @ApiPropertyOptional({ description: 'Dados do fornecedor' })
  fornecedor?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
    cnpjCpf?: string;
  };

  @ApiProperty({ description: 'ID do responsável' })
  responsavelId: string;

  @ApiPropertyOptional({ description: 'Dados do responsável' })
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'ID do aprovador' })
  aprovadorId?: string;

  @ApiPropertyOptional({ description: 'Dados do aprovador' })
  aprovador?: {
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

// DTOs para aprovação/reprovação em lote
export class AprovarLoteDto {
  @ApiProperty({ description: 'IDs das cotações a serem aprovadas', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  cotacaoIds: string[];

  @ApiPropertyOptional({ description: 'Justificativa da aprovação (opcional)' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  justificativa?: string;
}

export class ReprovarLoteDto {
  @ApiProperty({ description: 'IDs das cotações a serem reprovadas', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  cotacaoIds: string[];

  @ApiProperty({ description: 'Justificativa da reprovação (obrigatória)' })
  @IsString()
  @Length(10, 1000)
  justificativa: string;
}

export class ResultadoLoteDto {
  @ApiProperty({ description: 'Total de cotações processadas' })
  total: number;

  @ApiProperty({ description: 'Quantidade de sucessos' })
  sucessos: number;

  @ApiProperty({ description: 'Quantidade de falhas' })
  falhas: number;

  @ApiProperty({ description: 'IDs das cotações processadas com sucesso', type: [String] })
  cotacoesProcessadas: string[];

  @ApiProperty({ description: 'Erros ocorridos', type: [Object] })
  erros: Array<{ cotacaoId: string; erro: string }>;
}
