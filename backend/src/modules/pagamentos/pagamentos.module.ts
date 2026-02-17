import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracaoGateway } from './entities/configuracao-gateway.entity';
import { TransacaoGateway } from './entities/transacao-gateway.entity';
import { Fatura } from '../faturamento/entities/fatura.entity';
import { Pagamento } from '../faturamento/entities/pagamento.entity';
import { ConfiguracaoGatewayController } from './controllers/configuracao-gateway.controller';
import { GatewayTransacoesController } from './controllers/pagamentos.controller';
import { ConfiguracaoGatewayService } from './services/configuracao-gateway.service';
import { PagamentosGatewayService } from './services/pagamentos.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConfiguracaoGateway, TransacaoGateway, Fatura, Pagamento])],
  controllers: [ConfiguracaoGatewayController, GatewayTransacoesController],
  providers: [ConfiguracaoGatewayService, PagamentosGatewayService],
  exports: [ConfiguracaoGatewayService, PagamentosGatewayService],
})
export class PagamentosModule {}
