import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModuloEmpresaDto {
  @ApiProperty({
    description: 'Nome do modulo a ser ativado',
    example: 'crm',
    enum: ['crm', 'atendimento', 'comercial', 'financeiro', 'produtos', 'configuracoes'],
  })
  @IsString()
  modulo: string;

  @ApiPropertyOptional({
    description:
      'LEGADO (nao suportado). Limites/configuracoes nao sao aceitos no Core Admin para modulo de empresa.',
    example: {
      usuarios: 10,
      leads: 1000,
      storage_mb: 5120,
      api_calls_dia: 10000,
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
      habilitarIA: true,
      webhooksAtivos: false,
      notificacoesEmail: true,
    },
    deprecated: true,
  })
  @IsOptional()
  @IsObject()
  configuracoes?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Se o modulo deve ser ativado imediatamente',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
