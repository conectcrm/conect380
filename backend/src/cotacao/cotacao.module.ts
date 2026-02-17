import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotacaoController } from './cotacao.controller';
import { CotacaoService } from './cotacao.service';
import { CotacaoEmailService } from './cotacao-email.service';
import { Cotacao } from './entities/cotacao.entity';
import { ItemCotacao } from './entities/item-cotacao.entity';
import { AnexoCotacao } from './entities/anexo-cotacao.entity';
import { Fornecedor } from '../modules/financeiro/entities/fornecedor.entity';
import { User } from '../modules/users/user.entity';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cotacao, ItemCotacao, AnexoCotacao, Fornecedor, User]),
    NotificationModule,
  ],
  controllers: [CotacaoController],
  providers: [CotacaoService, CotacaoEmailService],
  exports: [CotacaoService],
})
export class CotacaoModule {}
