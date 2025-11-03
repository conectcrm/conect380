import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../modules/users/user.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Cliente } from '../modules/clientes/cliente.entity';
import { Contato } from '../modules/clientes/contato.entity';
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
import { Canal } from '../modules/atendimento/entities/canal.entity';
import { Fila } from '../modules/atendimento/entities/fila.entity';
import { Atendente } from '../modules/atendimento/entities/atendente.entity';
import { Ticket } from '../modules/atendimento/entities/ticket.entity';
import { Mensagem } from '../modules/atendimento/entities/mensagem.entity';
import { IntegracoesConfig } from '../modules/atendimento/entities/integracoes-config.entity'; // ✅ Adicionado para IA
import { NotaCliente } from '../modules/atendimento/entities/nota-cliente.entity'; // ✅ SPRINT 1 - Notas dos clientes
import { Demanda } from '../modules/atendimento/entities/demanda.entity'; // ✅ SPRINT 1 - Demandas dos clientes
import { NucleoAtendimento } from '../modules/triagem/entities/nucleo-atendimento.entity';
import { Departamento } from '../modules/triagem/entities/departamento.entity';
import { FluxoTriagem } from '../modules/triagem/entities/fluxo-triagem.entity';
import { SessaoTriagem } from '../modules/triagem/entities/sessao-triagem.entity';
import { Equipe } from '../modules/triagem/entities/equipe.entity';
import { AtendenteEquipe } from '../modules/triagem/entities/atendente-equipe.entity';
import { AtendenteAtribuicao } from '../modules/triagem/entities/atendente-atribuicao.entity';
import { EquipeAtribuicao } from '../modules/triagem/entities/equipe-atribuicao.entity';
import { TriagemLog } from '../modules/triagem/entities/triagem-log.entity';

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
        Contato, // ✅ Entity de contatos vinculados a clientes
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
        AssinaturaContrato,
        Canal, // Módulo omnichannel
        Fila, // Módulo omnichannel
        Atendente, // Módulo omnichannel
        Ticket, // Módulo omnichannel
        Mensagem, // Módulo omnichannel
        IntegracoesConfig, // ✅ Configurações de IA (OpenAI, Anthropic)
        NotaCliente, // ✅ SPRINT 1 - Notas dos clientes
        Demanda, // ✅ SPRINT 1 - Demandas dos clientes
        NucleoAtendimento, // Módulo triagem
        Departamento, // Módulo triagem
        FluxoTriagem, // Módulo triagem
        SessaoTriagem, // Módulo triagem
        Equipe, // Módulo triagem
        AtendenteEquipe, // Módulo triagem
        AtendenteAtribuicao, // Módulo triagem
        EquipeAtribuicao, // Módulo triagem
        TriagemLog, // Módulo triagem
      ],
      synchronize: false, // Desabilitado - apenas tabelas base criadas manualmente
      logging: this.configService.get('APP_ENV') === 'development',
      cache: false, // ⚡ CRITICAL: Desabilita cache do TypeORM para evitar dados obsoletos
      // SSL apenas se DATABASE_SSL=true (para RDS externo)
      ssl: this.configService.get('DATABASE_SSL') === 'true' ? {
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
