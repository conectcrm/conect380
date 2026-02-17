import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../modules/users/user.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Cliente } from '../modules/clientes/cliente.entity';
import { ClienteAnexo } from '../modules/clientes/cliente-anexo.entity';
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
import { ConfiguracaoInatividade } from '../modules/atendimento/entities/configuracao-inatividade.entity'; // ✅ Fechamento automático por inatividade
import { DistribuicaoConfig } from '../modules/atendimento/entities/distribuicao-config.entity'; // ✅ Distribuição automática
import { AtendenteSkill } from '../modules/atendimento/entities/atendente-skill.entity'; // ✅ Skills de atendentes
import { DistribuicaoLog } from '../modules/atendimento/entities/distribuicao-log.entity'; // ✅ Log de distribuições
import { Tag } from '../modules/atendimento/entities/tag.entity'; // ✅ Sistema de Tags (substitui departamentos)
import { MessageTemplate } from '../modules/atendimento/entities/message-template.entity'; // ✅ Templates de Mensagens
import { SlaConfig } from '../modules/atendimento/entities/sla-config.entity'; // ✅ SLA Tracking - Configurações
import { SlaEventLog } from '../modules/atendimento/entities/sla-event-log.entity'; // ✅ SLA Tracking - Logs de eventos
import { NucleoAtendimento } from '../modules/triagem/entities/nucleo-atendimento.entity';
import { Departamento } from '../modules/triagem/entities/departamento.entity';
import { FluxoTriagem } from '../modules/triagem/entities/fluxo-triagem.entity';
import { SessaoTriagem } from '../modules/triagem/entities/sessao-triagem.entity';
import { Equipe } from '../modules/triagem/entities/equipe.entity';
import { AtendenteEquipe } from '../modules/triagem/entities/atendente-equipe.entity';
import { AtendenteAtribuicao } from '../modules/triagem/entities/atendente-atribuicao.entity';
import { EquipeAtribuicao } from '../modules/triagem/entities/equipe-atribuicao.entity';
import { TriagemLog } from '../modules/triagem/entities/triagem-log.entity';
import { EmpresaModulo } from '../modules/empresas/entities/empresa-modulo.entity'; // ✅ Sistema de licenciamento modular
import { EmpresaConfig } from '../modules/empresas/entities/empresa-config.entity'; // ✅ Configurações de empresa
import { PasswordResetToken } from '../modules/auth/entities/password-reset-token.entity'; // ✅ Tokens de recuperação de senha
import { Lead } from '../modules/leads/lead.entity'; // ✅ Módulo de Leads CRM
import { ConfiguracaoGateway } from '../modules/pagamentos/entities/configuracao-gateway.entity';
import { TransacaoGateway } from '../modules/pagamentos/entities/transacao-gateway.entity';
import { Cotacao } from '../cotacao/entities/cotacao.entity';
import { ItemCotacao } from '../cotacao/entities/item-cotacao.entity';
import { AnexoCotacao } from '../cotacao/entities/anexo-cotacao.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const { FilaAtendente } = require('../modules/atendimento/entities/fila-atendente.entity');

    const config = {
      type: 'postgres',
      host: this.configService.get('DATABASE_HOST', 'localhost'),
      port: parseInt(this.configService.get('DATABASE_PORT', '5433')),
      username: this.configService.get('DATABASE_USERNAME', 'postgres'),
      password: this.configService.get('DATABASE_PASSWORD', 'postgres'),
      database: this.configService.get('DATABASE_NAME', 'conectcrm'),
      entities: [
        User,
        Empresa,
        Cliente,
        ClienteAnexo,
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
        FilaAtendente, // ✅ ETAPA 5 - Junction table Fila ↔ Atendente
        Atendente, // Módulo omnichannel
        Ticket, // Módulo omnichannel
        Mensagem, // Módulo omnichannel
        IntegracoesConfig, // ✅ Configurações de IA (OpenAI, Anthropic)
        NotaCliente, // ✅ SPRINT 1 - Notas dos clientes
        Demanda, // ✅ SPRINT 1 - Demandas dos clientes
        ConfiguracaoInatividade, // ✅ Fechamento automático por inatividade
        DistribuicaoConfig, // ✅ Distribuição automática de tickets
        AtendenteSkill, // ✅ Skills/competências de atendentes
        DistribuicaoLog, // ✅ Log de distribuições automáticas
        Tag, // ✅ Sistema de Tags (categorização flexível de tickets)
        MessageTemplate, // ✅ Templates de Mensagens (respostas rápidas)
        SlaConfig, // ✅ SLA Tracking - Configurações de SLA
        SlaEventLog, // ✅ SLA Tracking - Logs de eventos SLA
        ConfiguracaoGateway,
        TransacaoGateway,
        Cotacao,
        ItemCotacao,
        AnexoCotacao,
        Notification, // ✅ Sistema de notificações
        NucleoAtendimento, // Módulo triagem
        Departamento, // Módulo triagem
        FluxoTriagem, // Módulo triagem
        SessaoTriagem, // Módulo triagem
        Equipe, // Módulo triagem
        AtendenteEquipe, // Módulo triagem
        AtendenteAtribuicao, // Módulo triagem
        EquipeAtribuicao, // Módulo triagem
        TriagemLog, // Módulo triagem
        EmpresaModulo, // ✅ Sistema de licenciamento modular
        EmpresaConfig, // ✅ Configurações de empresa
        PasswordResetToken, // ✅ Tokens de recuperação de senha
        Lead, // ✅ Módulo de Leads CRM
      ],
      synchronize: false, // ✅ DESABILITADO - usar migrations para segurança
      logging: this.configService.get('APP_ENV') === 'development',
      cache: false, // ⚡ CRITICAL: Desabilita cache do TypeORM para evitar dados obsoletos
      // SSL apenas se DATABASE_SSL=true (para RDS externo)
      ssl:
        this.configService.get('DATABASE_SSL') === 'true'
          ? {
              rejectUnauthorized: false,
            }
          : false,
    };

    // Debug log
    console.log('📊 Database Config:', {
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password?.substr(0, 3) + '***',
      database: config.database,
      entitiesCount: config.entities.length, // ✅ Quantas entities carregadas
      synchronize: config.synchronize, // ✅ Confirmar se está true
    });

    return config as TypeOrmModuleOptions;
  }
}
