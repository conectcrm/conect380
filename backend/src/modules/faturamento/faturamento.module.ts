import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaturamentoController } from './faturamento.controller';
import { FaturamentoService } from './services/faturamento.service';
import { PagamentoService } from './services/pagamento.service';
import { CobrancaService } from './services/cobranca.service';
import { Fatura } from './entities/fatura.entity';
import { ItemFatura } from './entities/item-fatura.entity';
import { Pagamento } from './entities/pagamento.entity';
import { PlanoCobranca } from './entities/plano-cobranca.entity';
import { ContratosModule } from '../contratos/contratos.module';
import { PropostasModule } from '../propostas/propostas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fatura, ItemFatura, Pagamento, PlanoCobranca]),
    forwardRef(() => ContratosModule), // Para evitar dependência circular
    PropostasModule, // Para acessar o EmailIntegradoService
  ],
  controllers: [FaturamentoController],
  providers: [FaturamentoService, PagamentoService, CobrancaService],
  exports: [FaturamentoService, PagamentoService, CobrancaService],
})
export class FaturamentoModule {}
