import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class IniciarTriagemDto {
  @IsString()
  @IsNotEmpty({ message: 'O telefone do contato é obrigatório' })
  contatoTelefone: string;

  @IsString()
  @IsOptional()
  contatoNome?: string;

  @IsString()
  @IsNotEmpty({ message: 'O ID do fluxo é obrigatório' })
  fluxoId: string;

  @IsEnum(['whatsapp', 'chat', 'telegram'])
  @IsNotEmpty({ message: 'O canal é obrigatório' })
  canal: string;

  @IsString()
  @IsOptional()
  canalId?: string; // ID específico do canal (ex: número WhatsApp)

  @IsString()
  @IsOptional()
  mensagemInicial?: string;
}
