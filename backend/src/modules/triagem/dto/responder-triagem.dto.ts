import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ResponderTriagemDto {
  @IsString()
  @IsNotEmpty({ message: 'O ID da sessão é obrigatório' })
  sessaoId: string;

  @IsString()
  @IsNotEmpty({ message: 'A resposta é obrigatória' })
  resposta: string;

  @IsString()
  @IsOptional()
  contatoTelefone?: string;

  @IsString()
  @IsOptional()
  canal?: string;
}
