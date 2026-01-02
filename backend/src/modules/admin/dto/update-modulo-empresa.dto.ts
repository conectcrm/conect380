import { IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModuloEmpresaDto {
  @ApiPropertyOptional({
    description: 'Se o módulo está ativo ou inativo',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Limites atualizados do módulo',
    example: {
      usuarios: 20,
      leads: 5000,
      storage_mb: 10240
    }
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
    description: 'Configurações específicas do módulo',
    example: {
      habilitarIA: false,
      webhooksAtivos: true
    }
  })
  @IsOptional()
  @IsObject()
  configuracoes?: Record<string, any>;
}
