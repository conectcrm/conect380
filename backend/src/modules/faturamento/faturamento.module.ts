import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaturamentoController } from './faturamento.controller';
import { FaturamentoService } from './services/faturamento.service';
import { PagamentoService } from './services/pagamento.service';
import { CobrancaService } from './services/cobranca.service';
import { DocumentoFiscalService } from './services/documento-fiscal.service';
import { Fatura } from './entities/fatura.entity';
import { ItemFatura } from './entities/item-fatura.entity';
import { Pagamento } from './entities/pagamento.entity';
import { PlanoCobranca } from './entities/plano-cobranca.entity';
import { ContratosModule } from '../contratos/contratos.module';
import { PropostasModule } from '../propostas/propostas.module';
import { Cliente } from '../clientes/cliente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fatura, ItemFatura, Pagamento, PlanoCobranca, Cliente]),
    forwardRef(() => ContratosModule), // Para evitar dependencia circular
    PropostasModule, // Para acessar o EmailIntegradoService
  ],
  controllers: [FaturamentoController],
  providers: [FaturamentoService, PagamentoService, CobrancaService, DocumentoFiscalService],
  exports: [FaturamentoService, PagamentoService, CobrancaService, DocumentoFiscalService],
})
export class FaturamentoModule {}

