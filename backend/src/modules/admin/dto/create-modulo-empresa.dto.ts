import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModuloEmpresaDto {
  @ApiProperty({
    description: 'Nome do módulo a ser ativado',
    example: 'crm',
    enum: ['crm', 'atendimento', 'comercial', 'financeiro', 'produtos', 'configuracoes']
  })
  @IsString()
  modulo: string;

  @ApiPropertyOptional({
    description: 'Limites de uso do módulo',
    example: {
      usuarios: 10,
      leads: 1000,
      storage_mb: 5120,
      api_calls_dia: 10000
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
      habilitarIA: true,
      webhooksAtivos: false,
      notificacoesEmail: true
    }
  })
  @IsOptional()
  @IsObject()
  configuracoes?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Se o módulo deve ser ativado imediatamente',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
