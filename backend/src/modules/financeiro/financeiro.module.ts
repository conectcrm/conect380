import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FornecedorController } from './controllers/fornecedor.controller';
import { ContaPagarController } from './controllers/conta-pagar.controller';
import { ContaBancariaController } from './controllers/conta-bancaria.controller';
import { ConciliacaoBancariaController } from './controllers/conciliacao-bancaria.controller';
import { AlertaOperacionalFinanceiroController } from './controllers/alerta-operacional-financeiro.controller';
import { FornecedorService } from './services/fornecedor.service';
import { ContaPagarService } from './services/conta-pagar.service';
import { ContaBancariaService } from './services/conta-bancaria.service';
import { ConciliacaoBancariaService } from './services/conciliacao-bancaria.service';
import { AlertaOperacionalFinanceiroService } from './services/alerta-operacional-financeiro.service';
import { AlertaOperacionalFinanceiroMonitorService } from './services/alerta-operacional-financeiro-monitor.service';
import { Fornecedor } from './entities/fornecedor.entity';
import { ContaPagar } from './entities/conta-pagar.entity';
import { ContaBancaria } from './entities/conta-bancaria.entity';
import { AlertaOperacionalFinanceiro } from './entities/alerta-operacional-financeiro.entity';
import { ContaPagarExportacao } from './entities/conta-pagar-exportacao.entity';
import { ExtratoBancarioImportacao } from './entities/extrato-bancario-importacao.entity';
import { ExtratoBancarioItem } from './entities/extrato-bancario-item.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { EmpresaConfig } from '../empresas/entities/empresa-config.entity';
import { GatewayWebhookEvento } from '../pagamentos/entities/gateway-webhook-evento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fornecedor,
      ContaPagar,
      ContaBancaria,
      AlertaOperacionalFinanceiro,
      ContaPagarExportacao,
      Empresa,
      EmpresaConfig,
      ExtratoBancarioImportacao,
      ExtratoBancarioItem,
      GatewayWebhookEvento,
    ]),
  ],
  providers: [
    FornecedorService,
    ContaPagarService,
    ContaBancariaService,
    ConciliacaoBancariaService,
    AlertaOperacionalFinanceiroService,
    AlertaOperacionalFinanceiroMonitorService,
  ],
  controllers: [
    FornecedorController,
    ContaPagarController,
    ContaBancariaController,
    ConciliacaoBancariaController,
    AlertaOperacionalFinanceiroController,
  ],
  exports: [
    FornecedorService,
    ContaPagarService,
    ContaBancariaService,
    ConciliacaoBancariaService,
    AlertaOperacionalFinanceiroService,
    AlertaOperacionalFinanceiroMonitorService,
  ],
})
export class FinanceiroModule {}
