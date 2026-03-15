import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './cliente.entity';
import { ClienteAnexo } from './cliente-anexo.entity';
import { Contato } from './contato.entity';
import { Ticket } from '../atendimento/entities/ticket.entity';
import { Proposta } from '../propostas/proposta.entity';
import { Contrato } from '../contratos/entities/contrato.entity';
import { Fatura } from '../faturamento/entities/fatura.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { ContatosService } from './services/contatos.service';
import { ContatosController } from './controllers/contatos.controller';
import { ContatosTestController } from './controllers/contatos-test.controller';
import { CacheService } from '../../common/services/cache.service';

const clientesDevControllers =
  process.env.NODE_ENV === 'development' ? [ContatosTestController] : [];

@Module({
  imports: [
    TypeOrmModule.forFeature([Cliente, ClienteAnexo, Contato, Ticket, Proposta, Contrato, Fatura]),
  ],
  providers: [ClientesService, ContatosService, CacheService],
  controllers: [ClientesController, ContatosController, ...clientesDevControllers],
  exports: [ClientesService, ContatosService, TypeOrmModule],
})
export class ClientesModule {}
