import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { PropostasModule } from './modules/propostas/propostas.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
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
    DashboardModule,
  ],
})
export class AppModule {}
