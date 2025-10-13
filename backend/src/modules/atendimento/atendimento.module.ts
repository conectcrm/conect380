import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';

// Entities - Apenas as essenciais que estão sendo usadas
import {
  Canal,
  Fila,
  Atendente,
  Ticket,
  Mensagem,
  IntegracoesConfig, // ✅ Adicionado para WhatsApp Webhook
} from './entities';
import { Cliente } from '../clientes/cliente.entity'; // ✅ SPRINT 1 - Para contexto e busca

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
import { TestCanaisController } from './controllers/test-canais.controller';
import { WhatsAppWebhookController } from './controllers/whatsapp-webhook.controller'; // ✅ Webhook
import { TicketController } from './controllers/ticket.controller'; // ✅ REST API Tickets
import { MensagemController } from './controllers/mensagem.controller'; // ✅ REST API Mensagens

// Services
import { WhatsAppWebhookService } from './services/whatsapp-webhook.service'; // ✅ Novo
import { ValidacaoIntegracoesService } from './services/validacao-integracoes.service'; // ✅ Novo - Validação de credenciais
import { AIResponseService } from './services/ai-response.service'; // ✅ Novo - IA para respostas
import { WhatsAppSenderService } from './services/whatsapp-sender.service'; // ✅ Novo - Envio WhatsApp
import { TicketService } from './services/ticket.service'; // ✅ Novo - Gestão de Tickets
import { MensagemService } from './services/mensagem.service'; // ✅ Novo - Gestão de Mensagens
import { ContextoClienteService } from './services/contexto-cliente.service'; // ✅ SPRINT 1 - Contexto Cliente
import { BuscaGlobalService } from './services/busca-global.service'; // ✅ SPRINT 1 - Busca Global

// Gateway
import { AtendimentoGateway } from './gateways/atendimento.gateway';


@Module({
  imports: [
    // TypeORM Entities - Apenas essenciais para teste
    TypeOrmModule.forFeature([
      Canal, // Entidade original sem relações
      Fila, // ✅ Adicionada
      Atendente, // ✅ Adicionada
      Ticket, // ✅ Adicionada
      Mensagem, // ✅ Adicionada
      IntegracoesConfig, // ✅ Adicionada para WhatsApp
      Cliente, // ✅ SPRINT 1 - Para contexto e busca global
      // AtendenteFila,
      // Historico,
      // Template,
      // Tag,
      // AIInsight,
      // BaseConhecimento,
      // AIResposta,
      // AIMetrica,
    ]),

    // Bull Queues - Temporariamente desabilitado
    /*BullModule.registerQueue(
      { name: 'webhooks' },
      { name: 'ai-analysis' },
      { name: 'messages' },
      { name: 'notifications' },
    ),*/

    // JWT para WebSocket
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],

  controllers: [
    TestCanaisController, // Controller de teste
    CanaisController, // ✅ Reabilitado
    FilasController, // ✅ Reabilitado
    AtendentesController, // ✅ Reabilitado
    TicketsController, // ✅ Reabilitado (simplificado)
    MensagensController, // ✅ Reabilitado (simplificado)
    WhatsAppWebhookController, // ✅ Webhook WhatsApp
    TicketController, // ✅ REST API Tickets
    MensagemController, // ✅ REST API Mensagens
    ContextoClienteController, // ✅ SPRINT 1 - Contexto Cliente
    BuscaGlobalController, // ✅ SPRINT 1 - Busca Global
  ],

  providers: [
    // Gateway WebSocket para comunicação em tempo real
    AtendimentoGateway,
    // Service WhatsApp Webhook
    WhatsAppWebhookService, // ✅ Adicionado
    // Service Validação de Integrações
    ValidacaoIntegracoesService, // ✅ Novo
    // Service IA para Respostas Automáticas
    AIResponseService, // ✅ Novo
    // Service Envio de Mensagens WhatsApp
    WhatsAppSenderService, // ✅ Novo
    // Service Gestão de Tickets
    TicketService, // ✅ Novo - CRUD de tickets
    // Service Gestão de Mensagens
    MensagemService, // ✅ Novo - CRUD de mensagens
    // SPRINT 1 Services
    ContextoClienteService, // ✅ SPRINT 1 - Contexto Cliente
    BuscaGlobalService, // ✅ SPRINT 1 - Busca Global
  ],

  exports: [
    // Exportar Gateway para ser usado por outros módulos
    AtendimentoGateway,
    // Exportar services para uso externo
    TicketService,
    MensagemService,
  ],
})
export class AtendimentoModule { }
