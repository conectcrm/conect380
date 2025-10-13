import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './cliente.entity';
import { Contato } from './contato.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { ContatosService } from './services/contatos.service';
import { ContatosController } from './controllers/contatos.controller';
import { ContatosTestController } from './controllers/contatos-test.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Contato])],
  providers: [ClientesService, ContatosService],
  controllers: [ClientesController, ContatosController, ContatosTestController],
  exports: [ClientesService, ContatosService],
})
export class ClientesModule { }
