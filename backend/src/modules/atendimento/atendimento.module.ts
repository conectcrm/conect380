import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';

// Entities - Apenas as essenciais que estão sendo usadas
import {
  Canal,
  Fila,
  Atendente,
  Ticket,
  Mensagem,
  IntegracoesConfig, // ✅ Adicionado para WhatsApp Webhook
  Tag, // ✅ Sistema de Tags
} from './entities';
import { MessageTemplate } from './entities/message-template.entity'; // ✅ Templates de Mensagens
import { FilaAtendente } from './entities/fila-atendente.entity'; // ✅ ETAPA 5 - Junction table Fila ↔ Atendente
import { NotaCliente } from './entities/nota-cliente.entity'; // ✅ SPRINT 1 - Notas dos clientes
import { Demanda } from './entities/demanda.entity'; // ✅ SPRINT 1 - Demandas dos clientes
import { ConfiguracaoInatividade } from './entities/configuracao-inatividade.entity'; // ✅ Fechamento automático por inatividade
import { DistribuicaoConfig } from './entities/distribuicao-config.entity'; // ✅ Distribuição Automática Avançada
import { AtendenteSkill } from './entities/atendente-skill.entity'; // ✅ Skills de atendentes
import { DistribuicaoLog } from './entities/distribuicao-log.entity'; // ✅ Logs de auditoria
import { SlaConfig } from './entities/sla-config.entity'; // ✅ SLA Tracking - Configurações
import { SlaEventLog } from './entities/sla-event-log.entity'; // ✅ SLA Tracking - Logs de eventos
import { DlqReprocessAudit } from './entities/dlq-reprocess-audit.entity'; // ✅ Auditoria de reprocessamentos DLQ
import { Cliente } from '../clientes/cliente.entity'; // ✅ SPRINT 1 - Para contexto e busca
import { Contato } from '../clientes/contato.entity'; // ✅ Para status online
import { User } from '../users/user.entity'; // ✅ Para auto-criação de usuários ao criar atendente
import { SessaoTriagem } from '../triagem/entities/sessao-triagem.entity';
import { Evento } from '../eventos/evento.entity';
import { Departamento } from '../triagem/entities/departamento.entity'; // ✅ Para configuração por departamento

// Controllers
import {
  TicketsController,
  MensagensController,
  CanaisController,
  FilasController,
  AtendentesController,
  ContextoClienteController,
  BuscaGlobalController,
} from './controllers';
import { FilaController } from './controllers/fila.controller'; // ✅ ETAPA 5 - Sistema de Filas
import { TestCanaisController } from './controllers/test-canais.controller';
import { WhatsAppWebhookController } from './controllers/whatsapp-webhook.controller'; // ✅ Webhook
import { TicketController } from './controllers/ticket.controller'; // ✅ REST API Tickets
import { MensagemController } from './controllers/mensagem.controller'; // ✅ REST API Mensagens
import { NotaClienteController } from './controllers/nota-cliente.controller'; // ✅ SPRINT 1 - Notas
import { DemandaController } from './controllers/demanda.controller'; // ✅ SPRINT 1 - Demandas
import { SetupController } from './controllers/setup.controller'; // 🚀 Setup inicial (público)
import { ConfiguracaoInactividadeController } from './controllers/configuracao-inatividade.controller'; // ✅ Fechamento automático
import { AnalyticsController } from './controllers/analytics.controller'; // ✅ Dashboard Analytics
import { DistribuicaoController } from './controllers/distribuicao.controller'; // ✅ AUTO-DISTRIBUIÇÃO - Distribuição de tickets
import { DistribuicaoAvancadaController } from './controllers/distribuicao-avancada.controller'; // ✅ Distribuição Avançada (4 algoritmos)
import { TagsController } from './controllers/tags.controller'; // ✅ Sistema de Tags (gestão de tags)
import { MessageTemplateController } from './controllers/message-template.controller'; // ✅ Templates de Mensagens
import { SlaController } from './controllers/sla.controller'; // ✅ SLA Tracking
import { DlqController } from './controllers/dlq.controller'; // ✅ Reprocessamento de DLQ

// Services
import { AtendenteService } from './services/atendente.service'; // ✅ Gestão de Atendentes (auto-cria User)
import { FilaService } from './services/fila.service'; // ✅ ETAPA 5 - Sistema de Filas
import { DistribuicaoService } from './services/distribuicao.service'; // ✅ AUTO-DISTRIBUIÇÃO - Algoritmos de distribuição
import { WhatsAppWebhookService } from './services/whatsapp-webhook.service'; // ✅ Novo
import { ValidacaoIntegracoesService } from './services/validacao-integracoes.service'; // ✅ Novo - Validação de credenciais
import { AIResponseService } from './services/ai-response.service'; // ✅ Novo - IA para respostas
import { WhatsAppSenderService } from './services/whatsapp-sender.service'; // ✅ Novo - Envio WhatsApp
import { WhatsAppConfigService } from './services/whatsapp-config.service'; // 🔐 NOVO - Config centralizada WhatsApp
import { EmailSenderService } from './services/email-sender.service'; // ✅ NOVO - Envio E-mail
import { WhatsAppInteractiveService } from './services/whatsapp-interactive.service'; // ✅ Novo - Botões interativos
import { TicketService } from './services/ticket.service'; // ✅ Novo - Gestão de Tickets
import { MensagemService } from './services/mensagem.service'; // ✅ Novo - Gestão de Mensagens
import { ContextoClienteService } from './services/contexto-cliente.service'; // ✅ SPRINT 1 - Contexto Cliente
import { BuscaGlobalService } from './services/busca-global.service'; // ✅ SPRINT 1 - Busca Global
import { OnlineStatusService } from './services/online-status.service'; // ✅ Status Online/Offline
import { NotaClienteService } from './services/nota-cliente.service'; // ✅ SPRINT 1 - Notas
import { DemandaService } from './services/demanda.service'; // ✅ SPRINT 1 - Demandas
import { InactivityMonitorService } from './services/inactivity-monitor.service'; // ✅ Monitoramento de inatividade
import { DistribuicaoAvancadaService } from './services/distribuicao-avancada.service'; // ✅ Distribuição Avançada (4 algoritmos)
import { TagsService } from './services/tags.service'; // ✅ Sistema de Tags (CRUD de tags)
import { MessageTemplateService } from './services/message-template.service'; // ✅ Templates de Mensagens
import { SlaService } from './services/sla.service'; // ✅ SLA Tracking
import { SlaMonitorMinimoService } from './services/sla-monitor-minimo.service'; // ✅ SLA mínimo (cron)
import { AnalyticsService } from './services/analytics.service'; // ✅ Dashboard Analytics
import { WhatsAppWebhookProcessor } from './processors/whatsapp-webhook.processor';
import { WebhookIdempotencyService } from './services/webhook-idempotency.service';
import { QueueMetricsService } from './services/queue-metrics.service';
import { MessagesOutProcessor } from './processors/messages-out.processor';
import { DlqReprocessService } from './services/dlq-reprocess.service'; // ✅ Reprocessamento de DLQ

// Gateway
import { AtendimentoGateway } from './gateways/atendimento.gateway';
import { TriagemModule } from '../triagem/triagem.module';
import { NotificationModule } from '../../notifications/notification.module';

@Module({
  imports: [
    // Multer para upload de arquivos
    MulterModule.register({}),

    // TypeORM Entities - Apenas essenciais para teste
    TypeOrmModule.forFeature([
      Canal, // Entidade original sem relações
      Fila, // ✅ Adicionada
      FilaAtendente, // ✅ ETAPA 5 - Junction table
      Atendente, // ✅ Adicionada
      Ticket, // ✅ Adicionada
      Mensagem, // ✅ Adicionada
      IntegracoesConfig, // ✅ Adicionada para WhatsApp
      NotaCliente, // ✅ SPRINT 1 - Notas dos clientes
      Demanda, // ✅ SPRINT 1 - Demandas dos clientes
      ConfiguracaoInatividade, // ✅ Fechamento automático por inatividade
      DistribuicaoConfig, // ✅ Distribuição Automática Avançada - Configurações
      AtendenteSkill, // ✅ Distribuição Automática Avançada - Skills
      DistribuicaoLog, // ✅ Distribuição Automática Avançada - Logs
      Cliente, // ✅ SPRINT 1 - Para contexto e busca global
      Contato, // ✅ Para status online
      User, // ✅ Para auto-criação de usuários ao criar atendente
      SessaoTriagem,
      Evento,
      Departamento, // ✅ Para configuração de inatividade por departamento
      Tag, // ✅ Sistema de Tags (substitui departamentos)
      MessageTemplate, // ✅ Templates de Mensagens
      SlaConfig, // ✅ SLA Tracking - Configurações
      SlaEventLog, // ✅ SLA Tracking - Logs de eventos
      DlqReprocessAudit, // ✅ Auditoria de reprocessamentos DLQ
      // AtendenteFila,
      // Historico,
      // Template,
      // AIInsight,
      // BaseConhecimento,
      // AIResposta,
      // AIMetrica,
    ]),

    // Bull Queues - reativadas com opções padrão de resiliência
    BullModule.registerQueue(
      {
        name: 'webhooks-in',
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: 'messages-out',
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: 'notifications',
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: 'notifications-dlq',
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: 'ai-analysis',
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: 'webhooks-in-dlq',
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: false,
          removeOnFail: false,
        },
      },
      {
        name: 'messages-out-dlq',
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: false,
          removeOnFail: false,
        },
      },
    ),

    // JWT para WebSocket (usando mesma secret do módulo de autenticação)
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'seu_jwt_secret_super_seguro_aqui_2024',
      signOptions: { expiresIn: '24h' },
    }),
    HttpModule,
    NotificationModule,
    forwardRef(() => TriagemModule),
  ],

  controllers: [
    SetupController, // 🚀 Setup inicial (endpoints públicos)
    TestCanaisController, // Controller de teste
    CanaisController, // ✅ Reabilitado
    FilasController, // ✅ Reabilitado
    FilaController, // ✅ ETAPA 5 - Sistema de Filas (REST API completa)
    AtendentesController, // ✅ Reabilitado
    TicketsController, // ✅ Reabilitado (simplificado)
    MensagensController, // ✅ Reabilitado (simplificado)
    WhatsAppWebhookController, // ✅ Webhook WhatsApp
    TicketController, // ✅ REST API Tickets
    MensagemController, // ✅ REST API Mensagens
    NotaClienteController, // ✅ SPRINT 1 - Notas Cliente
    DemandaController, // ✅ SPRINT 1 - Demandas Cliente
    ConfiguracaoInactividadeController, // ✅ Fechamento automático
    DistribuicaoController, // ✅ AUTO-DISTRIBUIÇÃO - Distribuição de tickets
    DistribuicaoAvancadaController, // ✅ Distribuição Avançada (4 algoritmos)
    TagsController, // ✅ Sistema de Tags (REST API)
    MessageTemplateController, // ✅ Templates de Mensagens (REST API)
    SlaController, // ✅ SLA Tracking (REST API)
    AnalyticsController, // ✅ Dashboard Analytics (REST API)
    ContextoClienteController, // ✅ SPRINT 1 - Contexto Cliente
    BuscaGlobalController, // ✅ SPRINT 1 - Busca Global
    DlqController, // ✅ Reprocessamento de DLQs
  ],

  providers: [
    // Gateway WebSocket para comunicação em tempo real
    AtendimentoGateway,
    // Service Gestão de Atendentes (auto-cria usuários)
    AtendenteService, // ✅ Novo - Cria User automaticamente ao criar atendente
    // Service Sistema de Filas (ETAPA 5)
    FilaService, // ✅ ETAPA 5 - Distribuição de tickets (ROUND_ROBIN, MENOR_CARGA, PRIORIDADE)
    // Service Auto-Distribuição (Priority 2)
    DistribuicaoService, // ✅ AUTO-DISTRIBUIÇÃO - Algoritmos de distribuição automática
    // Service WhatsApp Webhook
    WhatsAppWebhookService, // ✅ Adicionado
    // Service Validação de Integrações
    ValidacaoIntegracoesService, // ✅ Novo
    // Service IA para Respostas Automáticas
    AIResponseService, // ✅ Novo
    // Service Envio de Mensagens WhatsApp
    WhatsAppSenderService, // ✅ Novo
    // Service Configuração Centralizada WhatsApp
    WhatsAppConfigService, // 🔐 NOVO - Fonte única de verdade para credenciais WhatsApp
    // Service Envio de E-mails
    EmailSenderService, // ✅ NOVO - SendGrid/SES/SMTP
    // Service Mensagens Interativas WhatsApp (botões e listas)
    WhatsAppInteractiveService, // ✅ Novo
    // Service Gestão de Tickets
    TicketService, // ✅ Novo - CRUD de tickets
    // Service Gestão de Mensagens
    MensagemService, // ✅ Novo - CRUD de mensagens
    // SPRINT 1 Services
    NotaClienteService, // ✅ SPRINT 1 - Notas Cliente
    DemandaService, // ✅ SPRINT 1 - Demandas Cliente
    InactivityMonitorService, // ✅ Monitoramento de inatividade
    ContextoClienteService, // ✅ SPRINT 1 - Contexto Cliente
    BuscaGlobalService, // ✅ SPRINT 1 - Busca Global
    // Status Online/Offline
    OnlineStatusService, // ✅ Status tempo real
    // Distribuição Avançada
    DistribuicaoAvancadaService, // ✅ Algoritmos avançados (round-robin, menor-carga, skills, híbrido)
    // Sistema de Tags
    TagsService, // ✅ CRUD de tags (substitui departamentos)
    // Sistema de Templates
    MessageTemplateService, // ✅ CRUD de templates + substituição de variáveis
    // Sistema de SLA
    SlaService, // ✅ SLA Tracking - Cálculos, métricas, alertas
    SlaMonitorMinimoService, // ✅ SLA mínimo - monitor de deadlines
    // Sistema de Analytics
    AnalyticsService, // ✅ Dashboard Analytics - Métricas agregadas e tendências
    WhatsAppWebhookProcessor, // ✅ Processamento assíncrono de webhooks WhatsApp
    MessagesOutProcessor, // ✅ Processamento assíncrono de outbound WhatsApp
    WebhookIdempotencyService, // ✅ Idempotência de webhooks
    QueueMetricsService, // ✅ Métricas + DLQ das filas
    DlqReprocessService, // ✅ Serviço para reprocessar DLQs
  ],

  exports: [
    // Exportar Gateway para ser usado por outros módulos
    AtendimentoGateway,
    // Exportar services para uso externo
    TicketService,
    MensagemService,
    FilaService, // ✅ ETAPA 5 - Exportado para integração com outros módulos
    DistribuicaoService, // ✅ AUTO-DISTRIBUIÇÃO - Exportado para uso externo
    DistribuicaoAvancadaService, // ✅ Distribuição Avançada - Exportado para uso externo
    WhatsAppSenderService, // ✅ Exportado para TriagemMessageSenderService
    EmailSenderService, // ✅ NOVO - Exportado para uso em outros módulos
    TypeOrmModule, // ✅ Exportar repositories para testes
  ],
})
export class AtendimentoModule { }
