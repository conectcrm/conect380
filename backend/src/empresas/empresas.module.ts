import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';
import { Empresa } from './entities/empresa.entity';
import { User } from '../modules/users/user.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, User]),
    MailModule
  ],
  controllers: [EmpresasController],
  providers: [EmpresasService],
  exports: [EmpresasService]
})
export class EmpresasModule {}
