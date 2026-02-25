import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}
