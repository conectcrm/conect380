import { IsString, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateAtendenteSkillDto {
  @IsString()
  atendenteId: string;

  @IsString()
  skill: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  nivel?: number;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
