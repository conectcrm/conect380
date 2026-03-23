import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

const trimValue = ({ value }: { value: unknown }): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export class DashboardV2QueryDto {
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsUUID('4')
  vendedorId?: string;

  @IsOptional()
  @IsString()
  @Transform(trimValue)
  pipelineId?: string;

  @IsOptional()
  @IsString()
  @Transform(trimValue)
  timezone?: string;
}
