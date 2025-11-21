import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
  IsUUID,
  Length,
  IsDecimal,
  Validate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TipoFatura, FormaPagamento } from '../entities/fatura.entity';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../../clientes/cliente.entity';

// ✅ VALIDADOR CUSTOMIZADO PARA CLIENTE
@ValidatorConstraint({ name: 'ClienteExists', async: true })
@Injectable()
export class ClienteExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async validate(clienteId: string, args: ValidationArguments) {
    if (!clienteId) return false;

    try {
      const cliente = await this.clienteRepository.findOne({
        where: { id: clienteId, ativo: true },
      });
      return !!cliente;
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Cliente não encontrado ou inativo';
  }
}

// ✅ VALIDADOR PARA DATA DE VENCIMENTO
@ValidatorConstraint({ name: 'DataVencimentoValida', async: false })
export class DataVencimentoValidaConstraint implements ValidatorConstraintInterface {
  validate(dataVencimento: string, args: ValidationArguments) {
    const vencimento = new Date(dataVencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Permitir vencimento a partir de hoje
    return vencimento >= hoje;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Data de vencimento deve ser igual ou posterior à data atual';
  }
}

export class ItemFaturaDto {
  @IsString()
  @Length(1, 500, { message: 'Descrição deve ter entre 1 e 500 caracteres' })
  descricao: string;

  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'Quantidade deve ser um número válido' })
  @Min(0.01, { message: 'Quantidade deve ser maior que zero' })
  @Max(999999, { message: 'Quantidade muito alta' })
  quantidade: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor unitário deve ser um número válido' })
  @Min(0.01, { message: 'Valor unitário deve ser maior que zero' })
  @Max(9999999.99, { message: 'Valor unitário muito alto' })
  valorUnitario: number;

  @IsOptional()
  @IsString()
  @Length(1, 10, { message: 'Unidade deve ter até 10 caracteres' })
  unidade?: string = 'un';

  @IsOptional()
  @IsString()
  @Length(0, 50, { message: 'Código do produto deve ter até 50 caracteres' })
  codigoProduto?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Percentual de desconto deve ser um número válido' },
  )
  @Min(0, { message: 'Percentual de desconto não pode ser negativo' })
  @Max(100, { message: 'Percentual de desconto não pode ser maior que 100%' })
  percentualDesconto?: number = 0;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor de desconto deve ser um número válido' })
  @Min(0, { message: 'Valor de desconto não pode ser negativo' })
  valorDesconto?: number = 0;

  // ✅ VALIDAÇÃO CALCULADA
  getValorTotal(): number {
    const subtotal = this.quantidade * this.valorUnitario;
    return Math.max(0, subtotal - (this.valorDesconto || 0));
  }

  validate(): string[] {
    const errors: string[] = [];

    const subtotal = this.quantidade * this.valorUnitario;
    const desconto = this.valorDesconto || 0;

    if (desconto > subtotal) {
      errors.push('Valor de desconto não pode ser maior que o subtotal do item');
    }

    return errors;
  }
}

export class CreateFaturaDto {
  @IsOptional()
  @IsNumber({}, { message: 'ID do contrato deve ser um número' })
  contratoId?: number;

  // ✅ CORREÇÃO: Usar UUID para cliente com validação forte
  @IsUUID(4, { message: 'ID do cliente deve ser um UUID válido' })
  @Validate(ClienteExistsConstraint, { message: 'Cliente não encontrado ou inativo' })
  clienteId: string;

  @IsUUID(4, { message: 'ID do usuário responsável deve ser um UUID válido' })
  usuarioResponsavelId: string;

  @IsEnum(TipoFatura, { message: 'Tipo de fatura inválido' })
  tipo: TipoFatura;

  @IsString()
  @Length(1, 1000, { message: 'Descrição deve ter entre 1 e 1000 caracteres' })
  descricao: string;

  @IsOptional()
  @IsEnum(FormaPagamento, { message: 'Forma de pagamento inválida' })
  formaPagamentoPreferida?: FormaPagamento = FormaPagamento.PIX;

  @IsDateString({}, { message: 'Data de vencimento deve ser uma data válida' })
  @Validate(DataVencimentoValidaConstraint)
  dataVencimento: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000, { message: 'Observações devem ter até 2000 caracteres' })
  observacoes?: string;

  @IsArray({ message: 'Itens deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ItemFaturaDto)
  itens: ItemFaturaDto[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor de desconto deve ser um número válido' })
  @Min(0, { message: 'Valor de desconto não pode ser negativo' })
  valorDesconto?: number = 0;

  // ✅ VALIDAÇÃO CUSTOMIZADA PARA O DTO COMPLETO
  validate(): string[] {
    const errors: string[] = [];

    // Validar itens
    if (!this.itens || this.itens.length === 0) {
      errors.push('Fatura deve ter pelo menos um item');
    }

    if (this.itens && this.itens.length > 100) {
      errors.push('Fatura não pode ter mais de 100 itens');
    }

    // Validar cada item
    this.itens?.forEach((item, index) => {
      const itemErrors = item.validate();
      itemErrors.forEach((error) => {
        errors.push(`Item ${index + 1}: ${error}`);
      });
    });

    // Validar valor total
    const valorTotalItens = this.getValorTotalCalculado();
    if (valorTotalItens <= 0) {
      errors.push('Valor total da fatura deve ser maior que zero');
    }

    if (this.valorDesconto && this.valorDesconto > valorTotalItens) {
      errors.push('Desconto global não pode ser maior que o valor total dos itens');
    }

    return errors;
  }

  getValorTotalCalculado(): number {
    if (!this.itens) return 0;

    const totalItens = this.itens.reduce((total, item) => {
      return total + item.getValorTotal();
    }, 0);

    return Math.max(0, totalItens - (this.valorDesconto || 0));
  }
}

export class UpdateFaturaDto {
  @IsOptional()
  @IsString()
  @Length(1, 1000, { message: 'Descrição deve ter entre 1 e 1000 caracteres' })
  descricao?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de vencimento deve ser uma data válida' })
  @Validate(DataVencimentoValidaConstraint)
  dataVencimento?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000, { message: 'Observações devem ter até 2000 caracteres' })
  observacoes?: string;

  @IsOptional()
  @IsEnum(FormaPagamento, { message: 'Forma de pagamento inválida' })
  formaPagamentoPreferida?: FormaPagamento;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor de desconto deve ser um número válido' })
  @Min(0, { message: 'Valor de desconto não pode ser negativo' })
  valorDesconto?: number;

  @IsOptional()
  @IsArray({ message: 'Itens deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ItemFaturaDto)
  itens?: ItemFaturaDto[];
}

export class GerarFaturaAutomaticaDto {
  @IsNumber({}, { message: 'ID do contrato deve ser um número' })
  contratoId: number;

  @IsOptional()
  @IsString()
  @Length(0, 2000, { message: 'Observações devem ter até 2000 caracteres' })
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  enviarEmail?: boolean = false;
}

// ✅ DTO PARA OPERAÇÕES SEGURAS
export class MarcarComoPagaDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor pago deve ser um número válido' })
  @Min(0.01, { message: 'Valor pago deve ser maior que zero' })
  valorPago: number;

  @IsOptional()
  @IsDateString({}, { message: 'Data de pagamento deve ser uma data válida' })
  dataPagamento?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Observações sobre o pagamento devem ter até 500 caracteres' })
  observacoesPagamento?: string;
}

export class CancelarFaturaDto {
  @IsString()
  @Length(1, 500, { message: 'Motivo do cancelamento é obrigatório e deve ter até 500 caracteres' })
  motivo: string;
}
