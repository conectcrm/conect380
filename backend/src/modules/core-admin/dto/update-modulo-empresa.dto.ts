import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdateModuloEmpresaDto {
  @ApiPropertyOptional({
    description: 'Se o modulo esta ativo ou inativo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    description:
      'LEGADO (nao suportado). Limites/configuracoes nao sao aceitos no Core Admin para modulo de empresa.',
    example: {
      usuarios: 20,
      leads: 5000,
      storage_mb: 10240,
    },
    deprecated: true,
  })
  @IsOptional()
  @IsObject()
  limites?: {
    usuarios?: number;
    leads?: number;
    storage_mb?: number;
    api_calls_dia?: number;
    whatsapp_conexoes?: number;
    email_envios_dia?: number;
  };

  @ApiPropertyOptional({
    description:
      'LEGADO (nao suportado). Limites/configuracoes nao sao aceitos no Core Admin para modulo de empresa.',
    example: {
      habilitarIA: false,
      webhooksAtivos: true,
    },
    deprecated: true,
  })
  @IsOptional()
  @IsObject()
  configuracoes?: Record<string, any>;
}
