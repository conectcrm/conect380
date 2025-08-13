import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { PropostasModule } from './modules/propostas/propostas.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { FaturamentoModule } from './modules/faturamento/faturamento.module';
import { CotacaoModule } from './cotacao/cotacao.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OportunidadesModule } from './modules/oportunidades/oportunidades.module';
import { EmpresasModule } from './empresas/empresas.module';
import { ChatwootModule } from './modules/chatwoot/chatwoot.module';
import { MetasModule } from './modules/metas/metas.module';
import { PlanosModule } from './modules/planos/planos.module';
import { EventosModule } from './modules/eventos/eventos.module';
import { AssinaturaMiddleware } from './modules/common/assinatura.middleware';
import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    AuthModule,
    UsersModule,
    ClientesModule,
    PropostasModule,
    ProdutosModule,
    ContratosModule,
    FinanceiroModule,
    FaturamentoModule,
    CotacaoModule,
    DashboardModule,
    OportunidadesModule,
    EmpresasModule,
    ChatwootModule,
    MetasModule,
    PlanosModule,
    EventosModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AssinaturaMiddleware)
      .exclude(
        '/auth/(.*)',
        '/planos/(.*)',
        '/assinaturas/(.*)',
        '/health',
        '/docs'
      )
      .forRoutes('*');
  }
}
