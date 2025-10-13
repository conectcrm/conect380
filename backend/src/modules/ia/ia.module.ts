import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IAService } from './ia.service';
import { IAController } from './ia.controller';
import { IAAutoRespostaService } from './ia-auto-resposta.service';

@Module({
  imports: [ConfigModule],
  controllers: [IAController],
  providers: [IAService, IAAutoRespostaService],
  exports: [IAService, IAAutoRespostaService],
})
export class IAModule { }
