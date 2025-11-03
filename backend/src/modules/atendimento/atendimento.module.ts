import { Module, forwardRef } from '@nestjs/common';
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
import { NotaCliente } from './entities/nota-cliente.entity'; // ✅ SPRINT 1 - Notas dos clientes
import { Demanda } from './entities/demanda.entity'; // ✅ SPRINT 1 - Demandas dos clientes
import { Cliente } from '../clientes/cliente.entity'; // ✅ SPRINT 1 - Para contexto e busca
import { Contato } from '../clientes/contato.entity'; // ✅ Para status online
import { User } from '../users/user.entity'; // ✅ Para auto-criação de usuários ao criar atendente
import { SessaoTriagem } from '../triagem/entities/sessao-triagem.entity';
import { Evento } from '../eventos/evento.entity';

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
import { NotaClienteController } from './controllers/nota-cliente.controller'; // ✅ SPRINT 1 - Notas
import { DemandaController } from './controllers/demanda.controller'; // ✅ SPRINT 1 - Demandas

// Services
import { AtendenteService } from './services/atendente.service'; // ✅ Gestão de Atendentes (auto-cria User)
import { WhatsAppWebhookService } from './services/whatsapp-webhook.service'; // ✅ Novo
import { ValidacaoIntegracoesService } from './services/validacao-integracoes.service'; // ✅ Novo - Validação de credenciais
import { AIResponseService } from './services/ai-response.service'; // ✅ Novo - IA para respostas
import { WhatsAppSenderService } from './services/whatsapp-sender.service'; // ✅ Novo - Envio WhatsApp
import { WhatsAppInteractiveService } from './services/whatsapp-interactive.service'; // ✅ Novo - Botões interativos
import { TicketService } from './services/ticket.service'; // ✅ Novo - Gestão de Tickets
import { MensagemService } from './services/mensagem.service'; // ✅ Novo - Gestão de Mensagens
import { ContextoClienteService } from './services/contexto-cliente.service'; // ✅ SPRINT 1 - Contexto Cliente
import { BuscaGlobalService } from './services/busca-global.service'; // ✅ SPRINT 1 - Busca Global
import { OnlineStatusService } from './services/online-status.service'; // ✅ Status Online/Offline
import { NotaClienteService } from './services/nota-cliente.service'; // ✅ SPRINT 1 - Notas
import { DemandaService } from './services/demanda.service'; // ✅ SPRINT 1 - Demandas

// Gateway
import { AtendimentoGateway } from './gateways/atendimento.gateway';
import { TriagemModule } from '../triagem/triagem.module';


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
      NotaCliente, // ✅ SPRINT 1 - Notas dos clientes
      Demanda, // ✅ SPRINT 1 - Demandas dos clientes
      Cliente, // ✅ SPRINT 1 - Para contexto e busca global
      Contato, // ✅ Para status online
      User, // ✅ Para auto-criação de usuários ao criar atendente
      SessaoTriagem,
      Evento,
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

    // JWT para WebSocket (usando mesma secret do módulo de autenticação)
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'seu_jwt_secret_super_seguro_aqui_2024',
      signOptions: { expiresIn: '24h' },
    }),
    forwardRef(() => TriagemModule),
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
    NotaClienteController, // ✅ SPRINT 1 - Notas Cliente
    DemandaController, // ✅ SPRINT 1 - Demandas Cliente
    ContextoClienteController, // ✅ SPRINT 1 - Contexto Cliente
    BuscaGlobalController, // ✅ SPRINT 1 - Busca Global
  ],

  providers: [
    // Gateway WebSocket para comunicação em tempo real
    AtendimentoGateway,
    // Service Gestão de Atendentes (auto-cria usuários)
    AtendenteService, // ✅ Novo - Cria User automaticamente ao criar atendente
    // Service WhatsApp Webhook
    WhatsAppWebhookService, // ✅ Adicionado
    // Service Validação de Integrações
    ValidacaoIntegracoesService, // ✅ Novo
    // Service IA para Respostas Automáticas
    AIResponseService, // ✅ Novo
    // Service Envio de Mensagens WhatsApp
    WhatsAppSenderService, // ✅ Novo
    // Service Mensagens Interativas WhatsApp (botões e listas)
    WhatsAppInteractiveService, // ✅ Novo
    // Service Gestão de Tickets
    TicketService, // ✅ Novo - CRUD de tickets
    // Service Gestão de Mensagens
    MensagemService, // ✅ Novo - CRUD de mensagens
    // SPRINT 1 Services
    NotaClienteService, // ✅ SPRINT 1 - Notas Cliente
    DemandaService, // ✅ SPRINT 1 - Demandas Cliente
    ContextoClienteService, // ✅ SPRINT 1 - Contexto Cliente
    BuscaGlobalService, // ✅ SPRINT 1 - Busca Global
    // Status Online/Offline
    OnlineStatusService, // ✅ Status tempo real
  ],

  exports: [
    // Exportar Gateway para ser usado por outros módulos
    AtendimentoGateway,
    // Exportar services para uso externo
    TicketService,
    MensagemService,
    WhatsAppSenderService, // ✅ Exportado para TriagemMessageSenderService
  ],
})
export class AtendimentoModule { }
