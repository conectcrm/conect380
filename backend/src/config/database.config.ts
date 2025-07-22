import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../modules/users/user.entity';
import { Empresa as EmpresaUser } from '../modules/users/empresa.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Cliente } from '../modules/clientes/cliente.entity';
import { Produto } from '../modules/produtos/produto.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'fenixcrm',
      password: 'fenixcrm123',
      database: 'fenixcrm_db',
      entities: [User, EmpresaUser, Empresa, Cliente, Produto],
      synchronize: this.configService.get('APP_ENV') === 'development',
      logging: this.configService.get('APP_ENV') === 'development',
      ssl: this.configService.get('APP_ENV') === 'production' ? {
        rejectUnauthorized: false,
      } : false,
    };
  }
}
