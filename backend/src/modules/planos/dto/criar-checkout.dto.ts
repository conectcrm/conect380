import { IsNotEmpty, IsString } from 'class-validator';

export class CriarCheckoutDto {
  @IsString()
  @IsNotEmpty()
  planoId: string;
}
