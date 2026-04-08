import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FornecedorController } from './controllers/fornecedor.controller';
import { ContaPagarController } from './controllers/conta-pagar.controller';
import { ContaBancariaController } from './controllers/conta-bancaria.controller';
import { ConciliacaoBancariaController } from './controllers/conciliacao-bancaria.controller';
import { AlertaOperacionalFinanceiroController } from './controllers/alerta-operacional-financeiro.controller';
import { CentroCustoController } from './controllers/centro-custo.controller';
import { ContaReceberController } from './controllers/conta-receber.controller';
import { FluxoCaixaController } from './controllers/fluxo-caixa.controller';
import { TesourariaController } from './controllers/tesouraria.controller';
import { FornecedorService } from './services/fornecedor.service';
import { ContaPagarService } from './services/conta-pagar.service';
import { ContaBancariaService } from './services/conta-bancaria.service';
import { ConciliacaoBancariaService } from './services/conciliacao-bancaria.service';
import { AlertaOperacionalFinanceiroService } from './services/alerta-operacional-financeiro.service';
import { AlertaOperacionalFinanceiroMonitorService } from './services/alerta-operacional-financeiro-monitor.service';
import { CentroCustoService } from './services/centro-custo.service';
import { ContaReceberService } from './services/conta-receber.service';
import { FluxoCaixaService } from './services/fluxo-caixa.service';
import { TesourariaService } from './services/tesouraria.service';
import { Fornecedor } from './entities/fornecedor.entity';
import { ContaPagar } from './entities/conta-pagar.entity';
import { ContaBancaria } from './entities/conta-bancaria.entity';
import { AlertaOperacionalFinanceiro } from './entities/alerta-operacional-financeiro.entity';
import { ContaPagarExportacao } from './entities/conta-pagar-exportacao.entity';
import { ExtratoBancarioImportacao } from './entities/extrato-bancario-importacao.entity';
import { ExtratoBancarioItem } from './entities/extrato-bancario-item.entity';
import { CentroCusto } from './entities/centro-custo.entity';
import { MovimentacaoTesouraria } from './entities/movimentacao-tesouraria.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { EmpresaConfig } from '../empresas/entities/empresa-config.entity';
import { GatewayWebhookEvento } from '../pagamentos/entities/gateway-webhook-evento.entity';
import { FaturamentoModule } from '../faturamento/faturamento.module';
import { Fatura } from '../faturamento/entities/fatura.entity';

@Module({
  imports: [
    FaturamentoModule,
    TypeOrmModule.forFeature([
      Fornecedor,
      ContaPagar,
      ContaBancaria,
      CentroCusto,
      AlertaOperacionalFinanceiro,
      ContaPagarExportacao,
      Empresa,
      EmpresaConfig,
      ExtratoBancarioImportacao,
      ExtratoBancarioItem,
      MovimentacaoTesouraria,
      GatewayWebhookEvento,
      Fatura,
    ]),
  ],
  providers: [
    FornecedorService,
    ContaPagarService,
    ContaBancariaService,
    CentroCustoService,
    ConciliacaoBancariaService,
    AlertaOperacionalFinanceiroService,
    AlertaOperacionalFinanceiroMonitorService,
    ContaReceberService,
    FluxoCaixaService,
    TesourariaService,
  ],
  controllers: [
    FornecedorController,
    ContaPagarController,
    ContaBancariaController,
    CentroCustoController,
    ConciliacaoBancariaController,
    AlertaOperacionalFinanceiroController,
    ContaReceberController,
    FluxoCaixaController,
    TesourariaController,
  ],
  exports: [
    FornecedorService,
    ContaPagarService,
    ContaBancariaService,
    CentroCustoService,
    ConciliacaoBancariaService,
    AlertaOperacionalFinanceiroService,
    AlertaOperacionalFinanceiroMonitorService,
    ContaReceberService,
    FluxoCaixaService,
    TesourariaService,
  ],
})
export class FinanceiroModule {}
