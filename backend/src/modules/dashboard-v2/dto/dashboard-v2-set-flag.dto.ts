import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class DashboardV2SetFlagDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;
}
