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
import { MetasModule } from './modules/metas/metas.module';
import { PlanosModule } from './modules/planos/planos.module';
import { EventosModule } from './modules/eventos/eventos.module';
import { AtendimentoModule } from './modules/atendimento/atendimento.module';
import { IAModule } from './modules/ia/ia.module';
import { TriagemModule } from './modules/triagem/triagem.module';
import { AssinaturaMiddleware } from './modules/common/assinatura.middleware';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { HealthController } from './health/health.controller';
import { DatabaseConfig } from './config/database.config';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
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
    MetasModule,
    PlanosModule,
    EventosModule,
    AtendimentoModule,
    IAModule,
    TriagemModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 🔒 CRÍTICO: Middleware de Tenant Context (Multi-Tenancy)
    // Define automaticamente o empresaId no PostgreSQL para RLS funcionar
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes('*'); // Aplicar em TODAS as rotas

    // Middleware de verificação de assinatura
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
