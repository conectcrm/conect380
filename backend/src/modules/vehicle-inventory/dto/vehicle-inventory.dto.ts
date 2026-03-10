import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const vehicleInventoryStatuses = [
  'disponivel',
  'reservado',
  'vendido',
  'indisponivel',
] as const;

export const vehicleInventoryFuelTypes = [
  'gasolina',
  'etanol',
  'flex',
  'diesel',
  'eletrico',
  'hibrido',
  'gnv',
  'outro',
] as const;

export const vehicleInventoryTransmissionTypes = [
  'manual',
  'automatico',
  'cvt',
  'semi_automatico',
  'outro',
] as const;

export type VehicleInventoryStatus = (typeof vehicleInventoryStatuses)[number];
export type VehicleInventoryFuelType = (typeof vehicleInventoryFuelTypes)[number];
export type VehicleInventoryTransmissionType =
  (typeof vehicleInventoryTransmissionTypes)[number];

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
};

const parseNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseNumberOrNull = (value: unknown): number | null | undefined => {
  if (value === null || value === '') return null;
  return parseNumber(value);
};

export class ListVehicleInventoryItemsDto {
  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(vehicleInventoryStatuses)
  status?: VehicleInventoryStatus;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsEnum(vehicleInventoryFuelTypes)
  combustivel?: VehicleInventoryFuelType;

  @IsOptional()
  @IsEnum(vehicleInventoryTransmissionTypes)
  cambio?: VehicleInventoryTransmissionType;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1900)
  @Max(2100)
  anoFabricacaoMin?: number;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1900)
  @Max(2100)
  anoFabricacaoMax?: number;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1900)
  @Max(2100)
  anoModeloMin?: number;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1900)
  @Max(2100)
  anoModeloMax?: number;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  includeDeleted?: boolean;

  @IsOptional()
  @IsEnum(['created_at', 'updated_at', 'valor_venda', 'ano_modelo', 'quilometragem'])
  sortBy?: 'created_at' | 'updated_at' | 'valor_venda' | 'ano_modelo' | 'quilometragem';

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class CreateVehicleInventoryItemDto {
  @IsOptional()
  @IsString()
  code?: string | null;

  @IsString()
  marca: string;

  @IsString()
  modelo: string;

  @IsOptional()
  @IsString()
  versao?: string | null;

  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1900)
  @Max(2100)
  anoFabricacao: number;

  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1900)
  @Max(2100)
  anoModelo: number;

  @IsOptional()
  @Transform(({ value }) => parseNumberOrNull(value))
  @IsNumber()
  @Min(0)
  quilometragem?: number | null;

  @IsOptional()
  @IsEnum(vehicleInventoryFuelTypes)
  combustivel?: VehicleInventoryFuelType | null;

  @IsOptional()
  @IsEnum(vehicleInventoryTransmissionTypes)
  cambio?: VehicleInventoryTransmissionType | null;

  @IsOptional()
  @IsString()
  cor?: string | null;

  @IsOptional()
  @IsString()
  placa?: string | null;

  @IsOptional()
  @IsString()
  chassi?: string | null;

  @IsOptional()
  @IsString()
  renavam?: string | null;

  @IsOptional()
  @Transform(({ value }) => parseNumberOrNull(value))
  @IsNumber()
  @Min(0)
  valorCompra?: number | null;

  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0)
  valorVenda: number;

  @IsOptional()
  @IsEnum(vehicleInventoryStatuses)
  status?: VehicleInventoryStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateVehicleInventoryItemDto extends PartialType(CreateVehicleInventoryItemDto) {}

export class UpdateVehicleInventoryStatusDto {
  @IsEnum(vehicleInventoryStatuses)
  status: VehicleInventoryStatus;
}

export class RestoreVehicleInventoryItemDto {
  @IsOptional()
  @IsEnum(vehicleInventoryStatuses)
  status?: VehicleInventoryStatus;
}

export class VehicleInventoryIdParamDto {
  @IsUUID()
  id: string;
}
