import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../modules/users/user.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Cliente } from '../modules/clientes/cliente.entity';
import { Produto } from '../modules/produtos/produto.entity';
import { Oportunidade } from '../modules/oportunidades/oportunidade.entity';
import { Atividade } from '../modules/oportunidades/atividade.entity';
import { Proposta } from '../modules/propostas/proposta.entity';
import { Plano } from '../modules/planos/entities/plano.entity';
import { ModuloSistema } from '../modules/planos/entities/modulo-sistema.entity';
import { PlanoModulo } from '../modules/planos/entities/plano-modulo.entity';
import { AssinaturaEmpresa } from '../modules/planos/entities/assinatura-empresa.entity';
import { Evento } from '../modules/eventos/evento.entity';
import { Fornecedor } from '../modules/financeiro/entities/fornecedor.entity';
import { Fatura } from '../modules/faturamento/entities/fatura.entity';
import { ItemFatura } from '../modules/faturamento/entities/item-fatura.entity';
import { Pagamento } from '../modules/faturamento/entities/pagamento.entity';
import { PlanoCobranca } from '../modules/faturamento/entities/plano-cobranca.entity';
import { Contrato } from '../modules/contratos/entities/contrato.entity';
import { AssinaturaContrato } from '../modules/contratos/entities/assinatura-contrato.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) { }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const config = {
      type: 'postgres',
      host: this.configService.get('DATABASE_HOST', 'localhost'),
      port: parseInt(this.configService.get('DATABASE_PORT', '5434')),
      username: this.configService.get('DATABASE_USERNAME', 'conectcrm'),
      password: this.configService.get('DATABASE_PASSWORD', 'conectcrm123'),
      database: this.configService.get('DATABASE_NAME', 'conectcrm_db'),
      entities: [
        User,
        Empresa,
        Cliente,
        Produto,
        Oportunidade,
        Atividade,
        Proposta,
        Plano,
        ModuloSistema,
        PlanoModulo,
        AssinaturaEmpresa,
        Evento,
        Fornecedor,
        Fatura,
        ItemFatura,
        Pagamento,
        PlanoCobranca,
        Contrato,
        AssinaturaContrato
      ],
      synchronize: false, // Desabilitado temporariamente para evitar conflitos de schema
      logging: this.configService.get('APP_ENV') === 'development',
      ssl: this.configService.get('APP_ENV') === 'production' ? {
        rejectUnauthorized: false,
      } : false,
    };

    // Debug log
    console.log('📊 Database Config:', {
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password?.substr(0, 3) + '***',
      database: config.database
    });

    return config as TypeOrmModuleOptions;
  }
}
