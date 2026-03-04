import { IsBoolean, IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSystemBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(12000000)
  logoFullUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(12000000)
  logoFullLightUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(12000000)
  logoIconUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(12000000)
  loadingLogoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(12000000)
  faviconUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  maintenanceEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  maintenanceTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  maintenanceMessage?: string | null;

  @IsOptional()
  @IsISO8601()
  maintenanceStartsAt?: string | null;

  @IsOptional()
  @IsISO8601()
  maintenanceExpectedEndAt?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(['info', 'warning', 'critical'])
  maintenanceSeverity?: 'info' | 'warning' | 'critical';
}
