import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import * as path from 'path';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { TenantQueryRunnerPatcher } from './common/tenant/tenant-query-runner.patcher';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/logger.config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { HttpsRedirectMiddleware } from './common/middleware/https-redirect.middleware';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
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
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { OportunidadesModule } from './modules/oportunidades/oportunidades.module';
import { EmpresasModule } from './empresas/empresas.module';
import { MetasModule } from './modules/metas/metas.module';
import { PlanosModule } from './modules/planos/planos.module';
import { EventosModule } from './modules/eventos/eventos.module';
import { AgendaModule } from './modules/agenda/agenda.module';
import { AtendimentoModule } from './modules/atendimento/atendimento.module';
import { IAModule } from './modules/ia/ia.module';
import { TriagemModule } from './modules/triagem/triagem.module';
import { LeadsModule } from './modules/leads/leads.module';
import { SearchModule } from './search/search.module';
import { AssinaturaMiddleware } from './modules/common/assinatura.middleware';
import { HealthController } from './health/health.controller';
import { RateLimitController } from './common/controllers/rate-limit.controller';
import { DatabaseConfig } from './config/database.config';
import { BullModule } from '@nestjs/bull';
import { PagamentosModule } from './modules/pagamentos/pagamentos.module';
import { NotificationModule } from './notifications/notification.module';
import { MetricsModule } from './modules/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Usa caminho absoluto para não depender do cwd (evita cair em defaults de outro DB)
      envFilePath: path.resolve(__dirname, '..', '.env'),
    }),
    // 📊 Winston Logger: Logs estruturados e rotação automática
    WinstonModule.forRoot(winstonConfig),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    // 🛡️ Rate Limiting: Proteção contra abuso de API
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 segundo
        limit: 10, // 10 requisições por segundo
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requisições por minuto
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutos
        limit: 1000, // 1000 requisições por 15 minutos
      },
    ]),
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
    AnalyticsModule,
    OportunidadesModule,
    EmpresasModule,
    MetasModule,
    PlanosModule,
    EventosModule,
    AgendaModule,
    AtendimentoModule,
    IAModule,
    TriagemModule,
    LeadsModule,
    SearchModule,
    PagamentosModule,
    NotificationModule,
    MetricsModule, // 📊 Prometheus metrics endpoint
  ],
  controllers: [HealthController, RateLimitController], // 📊 Health + Rate Limit monitoring
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    TenantQueryRunnerPatcher,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor, // 🛡️ Rate limiting anti-DDoS (100 req/min IP, 1000 empresa)
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 🔗 Correlation ID (primeiro middleware - gera ID para toda requisição)
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');

    // 🔒 HTTPS Redirect (Força HTTPS em produção)
    consumer.apply(HttpsRedirectMiddleware).forRoutes('*');

    // Middleware de verificação de assinatura
    consumer
      .apply(AssinaturaMiddleware)
      .exclude('/auth/(.*)', '/planos/(.*)', '/assinaturas/(.*)', '/health', '/docs')
      .forRoutes('*');
  }
}
