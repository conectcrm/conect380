# 🏗️ Arquitetura - Módulo Omnichannel

**Data de Criação**: 11 de dezembro de 2025  
**Versão**: 1.0.0  
**Responsável**: Equipe de Arquitetura + Desenvolvimento

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Alto Nível](#arquitetura-de-alto-nível)
3. [Componentes Backend](#componentes-backend)
4. [Componentes Frontend](#componentes-frontend)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [WebSocket (Realtime)](#websocket-realtime)
7. [Banco de Dados](#banco-de-dados)
8. [Integraões Externas](#integrações-externas)
9. [Escalabilidade](#escalabilidade)
10. [Segurança](#segurança)

---

## 🎯 Visão Geral

O módulo Omnichannel é o núcleo do sistema de atendimento do ConectCRM, permitindo comunicação em tempo real entre atendentes e clientes através de múltiplos canais.

### Tecnologias Principais

**Backend**:
- NestJS (framework Node.js)
- TypeORM (ORM para PostgreSQL)
- Socket.IO (WebSocket realtime)
- Bull (filas de mensagens)
- Redis (cache e pub/sub)

**Frontend**:
- React 18
- TypeScript
- Socket.IO Client
- Tailwind CSS
- Zustand (state management)

**Infraestrutura**:
- PostgreSQL 15 (banco de dados)
- Redis 7 (cache + pub/sub)
- NGINX (load balancer)
- Docker (containerização)

---

## 🏛️ Arquitetura de Alto Nível

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │     │  Atendente  │     │   Admin     │
│  (WhatsApp) │     │   (React)   │     │   (React)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │
       │ HTTP/Webhook      │ WebSocket          │ HTTP
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                    NGINX (Load Balancer)              │
└──────────────────────────────────────────────────────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Backend 1  │     │  Backend 2  │     │  Backend 3  │
│  (NestJS)   │     │  (NestJS)   │     │  (NestJS)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────┐
│              Redis (Pub/Sub + Cache)                 │
└──────────────────────────────────────────────────────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────┐
│              PostgreSQL (Database)                   │
└──────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│              Bull Queue (Background Jobs)            │
└──────────────────────────────────────────────────────┘
```

### Princípios Arquiteturais

1. **Separation of Concerns**: Backend (lógica de negócio) separado de Frontend (UI)
2. **Scalability**: Múltiplas instâncias backend com Redis Pub/Sub
3. **Reliability**: Filas para processamento assíncrono + retry mechanisms
4. **Real-time**: WebSocket (Socket.IO) para comunicação bidirecional
5. **Multi-tenancy**: Isolamento de dados por empresa (tenant)

---

## 🔙 Componentes Backend

### Estrutura de Módulos (NestJS)

```
backend/src/modules/atendimento/
├── entities/
│   ├── ticket.entity.ts
│   ├── mensagem.entity.ts
│   ├── atendente.entity.ts
│   ├── fila.entity.ts
│   └── canal.entity.ts
│
├── dto/
│   ├── create-ticket.dto.ts
│   ├── update-ticket.dto.ts
│   ├── send-mensagem.dto.ts
│   └── assign-ticket.dto.ts
│
├── services/
│   ├── ticket.service.ts           # CRUD de tickets
│   ├── mensagem.service.ts         # CRUD de mensagens
│   ├── distribuicao.service.ts     # Lógica de distribuição
│   ├── online-status.service.ts    # Status online/offline
│   └── metrics.service.ts          # Métricas de negócio
│
├── controllers/
│   ├── ticket.controller.ts        # Rotas HTTP (/tickets)
│   ├── mensagem.controller.ts      # Rotas HTTP (/mensagens)
│   └── atendente.controller.ts     # Rotas HTTP (/atendentes)
│
├── gateways/
│   └── atendimento.gateway.ts      # WebSocket gateway
│
├── queues/
│   ├── whatsapp.queue.ts           # Fila de WhatsApp
│   └── notification.queue.ts       # Fila de notificações
│
└── atendimento.module.ts           # Módulo raiz
```

### Fluxo de Requisição HTTP

```
Cliente (Frontend)
    │
    │ POST /tickets
    ▼
┌─────────────────────────┐
│  TicketController       │ ◄── Guards (Auth, RoleGuard)
│  @Post()                │ ◄── Interceptors (Logging)
│  async create(dto)      │ ◄── ValidationPipe (DTO)
└───────────┬─────────────┘
            │
            │ dto válido
            ▼
┌─────────────────────────┐
│  TicketService          │
│  async criar(dto)       │
│  {                      │
│    validate()           │ ◄── Business logic
│    save()               │ ◄── TypeORM Repository
│    emit event()         │ ◄── EventEmitter
│    return ticket        │
│  }                      │
└───────────┬─────────────┘
            │
            │ ticket salvo
            ▼
┌─────────────────────────┐
│  PostgreSQL Database    │
│  INSERT INTO tickets    │
└─────────────────────────┘
            │
            │ ticket criado
            ▼
┌─────────────────────────┐
│  AtendimentoGateway     │
│  broadcast('ticket_     │
│    criado', ticket)     │ ◄── Emit via WebSocket
└─────────────────────────┘
            │
            │ broadcast
            ▼
    Clientes conectados
     (Frontend React)
```

### Entities (TypeORM)

#### Ticket Entity

```typescript
// backend/src/modules/atendimento/entities/ticket.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';

@Entity('atendimento_tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: number; // Auto-incremento por empresa

  @Column({ type: 'enum', enum: ['ABERTO', 'EM_ANDAMENTO', 'PENDENTE', 'RESOLVIDO', 'FECHADO'] })
  status: string;

  @Column({ type: 'enum', enum: ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'] })
  prioridade: string;

  @Column()
  contato_nome: string;

  @Column()
  contato_telefone: string;

  @Column({ nullable: true })
  contato_email: string;

  @Column({ nullable: true })
  assunto: string;

  @Column({ nullable: true })
  empresaId: string;

  @Column({ nullable: true })
  atendenteId: string;

  @Column({ nullable: true })
  filaId: string;

  @Column({ nullable: true })
  canalId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  dataAberturaContato: Date;

  @Column({ nullable: true })
  dataPrimeiraResposta: Date;

  @Column({ nullable: true })
  dataResolucao: Date;

  @Column({ nullable: true })
  dataFechamento: Date;

  @OneToMany(() => Mensagem, (mensagem) => mensagem.ticket)
  mensagens: Mensagem[];

  @ManyToOne(() => Empresa)
  empresa: Empresa;

  @ManyToOne(() => Atendente)
  atendente: Atendente;

  @ManyToOne(() => Fila)
  fila: Fila;

  @ManyToOne(() => Canal)
  canal: Canal;
}
```

#### Mensagem Entity

```typescript
// backend/src/modules/atendimento/entities/mensagem.entity.ts
@Entity('atendimento_mensagens')
export class Mensagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  conteudo: string;

  @Column({ type: 'enum', enum: ['texto', 'imagem', 'audio', 'video', 'documento'] })
  tipo: string;

  @Column({ type: 'enum', enum: ['enviada', 'recebida'] })
  direcao: string;

  @Column({ nullable: true })
  arquivoUrl: string;

  @Column({ nullable: true })
  arquivoNome: string;

  @Column({ nullable: true })
  remetenteId: string;

  @Column()
  ticketId: string;

  @Column({ default: false })
  lida: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Ticket, (ticket) => ticket.mensagens)
  ticket: Ticket;

  @ManyToOne(() => Atendente)
  remetente: Atendente;
}
```

### Services (Lógica de Negócio)

```typescript
// backend/src/modules/atendimento/services/ticket.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async criar(dto: CreateTicketDto): Promise<Ticket> {
    // Gerar número sequencial
    const ultimoNumero = await this.ticketRepo
      .createQueryBuilder('ticket')
      .where('ticket.empresaId = :empresaId', { empresaId: dto.empresaId })
      .orderBy('ticket.numero', 'DESC')
      .getOne();

    const numero = (ultimoNumero?.numero || 0) + 1;

    const ticket = this.ticketRepo.create({
      ...dto,
      numero,
      status: 'ABERTO',
      dataAberturaContato: new Date(),
    });

    const ticketSalvo = await this.ticketRepo.save(ticket);

    // Emitir evento para distribuição
    this.eventEmitter.emit('ticket.criado', ticketSalvo);

    return ticketSalvo;
  }

  async listar(filtros: any): Promise<Ticket[]> {
    const query = this.ticketRepo.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.atendente', 'atendente')
      .leftJoinAndSelect('ticket.fila', 'fila')
      .where('ticket.empresaId = :empresaId', { empresaId: filtros.empresaId });

    if (filtros.status) {
      query.andWhere('ticket.status = :status', { status: filtros.status });
    }

    if (filtros.atendenteId) {
      query.andWhere('ticket.atendenteId = :atendenteId', { atendenteId: filtros.atendenteId });
    }

    return query.orderBy('ticket.createdAt', 'DESC').getMany();
  }

  async atribuir(ticketId: string, atendenteId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado');
    }

    ticket.atendenteId = atendenteId;
    ticket.status = 'EM_ANDAMENTO';

    const ticketAtualizado = await this.ticketRepo.save(ticket);

    // Emitir evento de atribuição
    this.eventEmitter.emit('ticket.atribuido', ticketAtualizado);

    return ticketAtualizado;
  }
}
```

### Gateway (WebSocket)

```typescript
// backend/src/modules/atendimento/gateways/atendimento.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/atendimento', cors: true })
export class AtendimentoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AtendimentoGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    const user = this.getUserFromSocket(client);
    client.emit('connected', { userId: user.id, message: 'Conectado com sucesso' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('ticket:entrar')
  handleEntrarTicket(client: Socket, payload: { ticketId: string }) {
    client.join(`ticket:${payload.ticketId}`);
    this.logger.log(`Cliente ${client.id} entrou na sala ticket:${payload.ticketId}`);
  }

  @SubscribeMessage('ticket:sair')
  handleSairTicket(client: Socket, payload: { ticketId: string }) {
    client.leave(`ticket:${payload.ticketId}`);
    this.logger.log(`Cliente ${client.id} saiu da sala ticket:${payload.ticketId}`);
  }

  @SubscribeMessage('mensagem:enviar')
  async handleEnviarMensagem(client: Socket, payload: any) {
    const user = this.getUserFromSocket(client);
    
    const mensagem = {
      ...payload,
      remetenteId: user.id,
      createdAt: new Date(),
    };

    // Salvar no banco
    await this.mensagemService.criar(mensagem);

    // Broadcast para todos na sala do ticket
    this.server.to(`ticket:${payload.ticketId}`).emit('nova_mensagem', mensagem);
  }

  @SubscribeMessage('usuario:digitando')
  handleUsuarioDigitando(client: Socket, payload: { ticketId: string, nome: string }) {
    // Broadcast para outros usuários na sala (exceto o próprio)
    client.to(`ticket:${payload.ticketId}`).emit('usuario_digitando', {
      userId: client.id,
      nome: payload.nome,
    });
  }

  // Métodos auxiliares
  private getUserFromSocket(socket: Socket): any {
    // Extrair usuário do token JWT no handshake
    return socket.handshake.auth.user;
  }

  // Métodos públicos para emitir eventos de outros services
  emitNovaMensagem(ticketId: string, mensagem: any) {
    this.server.to(`ticket:${ticketId}`).emit('nova_mensagem', mensagem);
  }

  emitTicketAtribuido(ticketId: string, atendente: any) {
    this.server.to(`ticket:${ticketId}`).emit('ticket_atribuido', { ticketId, atendente });
  }
}
```

---

## 🎨 Componentes Frontend

### Estrutura de Pastas

```
frontend-web/src/features/atendimento/omnichannel/
├── components/
│   ├── ChatArea.tsx              # Área principal de chat
│   ├── ChatInput.tsx             # Input de mensagem
│   ├── MensagemCard.tsx          # Card de mensagem individual
│   ├── TicketCard.tsx            # Card de ticket na lista
│   ├── TicketList.tsx            # Lista de tickets
│   ├── TicketHeader.tsx          # Cabeçalho do ticket
│   └── TypingIndicator.tsx       # Indicador "digitando..."
│
├── hooks/
│   ├── useWebSocket.ts           # Hook para WebSocket
│   ├── useAtendimentos.ts        # Hook para gerenciar atendimentos
│   └── useTickets.ts             # Hook para gerenciar tickets
│
├── services/
│   ├── atendimentoService.ts     # API calls (HTTP)
│   └── ticketService.ts          # API calls específicas de tickets
│
├── stores/
│   └── atendimentoStore.ts       # Zustand store
│
├── types/
│   ├── Ticket.ts                 # Interface de Ticket
│   └── Mensagem.ts               # Interface de Mensagem
│
├── utils/
│   └── statusUtils.ts            # Helpers de status
│
└── ChatOmnichannel.tsx           # Componente principal
```

### Componente Principal

```typescript
// frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx
import React, { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAtendimentos } from './hooks/useAtendimentos';
import { TicketList } from './components/TicketList';
import { ChatArea } from './components/ChatArea';
import { TicketHeader } from './components/TicketHeader';

const ChatOmnichannel: React.FC = () => {
  const [ticketSelecionado, setTicketSelecionado] = useState<string | null>(null);
  const { tickets, loading, error, carregarTickets } = useAtendimentos();
  const { 
    isConnected, 
    entrarTicket, 
    sairTicket, 
    enviarMensagem,
    onNovaMensagem,
    onUsuarioDigitando 
  } = useWebSocket();

  useEffect(() => {
    carregarTickets();
  }, []);

  const handleSelecionarTicket = (ticketId: string) => {
    // Sair do ticket anterior
    if (ticketSelecionado) {
      sairTicket(ticketSelecionado);
    }

    // Entrar no novo ticket
    setTicketSelecionado(ticketId);
    entrarTicket(ticketId);
  };

  return (
    <div className="chat-omnichannel flex h-screen">
      {/* Sidebar - Lista de Tickets */}
      <div className="w-80 border-r">
        <TicketList
          tickets={tickets}
          ticketSelecionado={ticketSelecionado}
          onSelecionar={handleSelecionarTicket}
          loading={loading}
        />
      </div>

      {/* Área Principal - Chat */}
      <div className="flex-1 flex flex-col">
        {ticketSelecionado ? (
          <>
            <TicketHeader 
              ticket={tickets.find(t => t.id === ticketSelecionado)} 
            />
            <ChatArea
              ticketId={ticketSelecionado}
              onEnviarMensagem={enviarMensagem}
              isConnected={isConnected}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Selecione um ticket para começar
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatOmnichannel;
```

### Hook de WebSocket

```typescript
// frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketReturn {
  isConnected: boolean;
  entrarTicket: (ticketId: string) => void;
  sairTicket: (ticketId: string) => void;
  enviarMensagem: (ticketId: string, mensagem: any) => void;
  onNovaMensagem: (callback: (mensagem: any) => void) => void;
  onUsuarioDigitando: (callback: (data: any) => void) => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef<{
    novaMensagem: ((mensagem: any) => void)[];
    usuarioDigitando: ((data: any) => void)[];
  }>({
    novaMensagem: [],
    usuarioDigitando: [],
  });

  useEffect(() => {
    // Conectar ao WebSocket
    const token = localStorage.getItem('authToken');
    
    const socket = io('http://localhost:3001/atendimento', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // Listeners de conexão
    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ WebSocket desconectado:', reason);
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconectado (tentativa ${attemptNumber})`);
      setIsConnected(true);
    });

    // Listeners de eventos de negócio
    socket.on('nova_mensagem', (mensagem) => {
      callbacksRef.current.novaMensagem.forEach(cb => cb(mensagem));
    });

    socket.on('usuario_digitando', (data) => {
      callbacksRef.current.usuarioDigitando.forEach(cb => cb(data));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const entrarTicket = useCallback((ticketId: string) => {
    socketRef.current?.emit('ticket:entrar', { ticketId });
  }, []);

  const sairTicket = useCallback((ticketId: string) => {
    socketRef.current?.emit('ticket:sair', { ticketId });
  }, []);

  const enviarMensagem = useCallback((ticketId: string, mensagem: any) => {
    socketRef.current?.emit('mensagem:enviar', { ticketId, ...mensagem });
  }, []);

  const onNovaMensagem = useCallback((callback: (mensagem: any) => void) => {
    callbacksRef.current.novaMensagem.push(callback);
  }, []);

  const onUsuarioDigitando = useCallback((callback: (data: any) => void) => {
    callbacksRef.current.usuarioDigitando.push(callback);
  }, []);

  return {
    isConnected,
    entrarTicket,
    sairTicket,
    enviarMensagem,
    onNovaMensagem,
    onUsuarioDigitando,
  };
};
```

### Service (HTTP API)

```typescript
// frontend-web/src/features/atendimento/omnichannel/services/atendimentoService.ts
import api from '../../../services/api';

export interface Ticket {
  id: string;
  numero: number;
  status: string;
  prioridade: string;
  contato_nome: string;
  contato_telefone: string;
  assunto?: string;
  createdAt: string;
}

export interface Mensagem {
  id: string;
  conteudo: string;
  tipo: string;
  direcao: string;
  remetenteId?: string;
  ticketId: string;
  createdAt: string;
}

export const atendimentoService = {
  // Tickets
  async listarTickets(filtros?: any): Promise<Ticket[]> {
    const response = await api.get('/atendimento/tickets', { params: filtros });
    return response.data;
  },

  async buscarTicket(id: string): Promise<Ticket> {
    const response = await api.get(`/atendimento/tickets/${id}`);
    return response.data;
  },

  async criarTicket(dados: Partial<Ticket>): Promise<Ticket> {
    const response = await api.post('/atendimento/tickets', dados);
    return response.data;
  },

  async atribuirTicket(ticketId: string, atendenteId: string): Promise<Ticket> {
    const response = await api.patch(`/atendimento/tickets/${ticketId}/atribuir`, { atendenteId });
    return response.data;
  },

  // Mensagens
  async listarMensagens(ticketId: string): Promise<Mensagem[]> {
    const response = await api.get(`/atendimento/tickets/${ticketId}/mensagens`);
    return response.data;
  },

  async enviarMensagem(ticketId: string, dados: Partial<Mensagem>): Promise<Mensagem> {
    const response = await api.post(`/atendimento/tickets/${ticketId}/mensagens`, dados);
    return response.data;
  },

  // Upload de arquivo
  async uploadArquivo(
    file: File, 
    ticketId: string, 
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('ticketId', ticketId);

    const response = await api.post('/atendimento/mensagens/arquivo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percentCompleted);
        }
      },
    });

    return response.data;
  },
};
```

---

## 🔄 Fluxo de Dados

### Fluxo 1: Cliente Envia Mensagem WhatsApp

```
[Cliente WhatsApp]
    │ Envia mensagem
    ▼
[Meta Cloud API]
    │ Webhook POST /webhooks/whatsapp
    ▼
[Backend NestJS]
    │ Processa webhook
    │ Identifica/cria ticket
    │ Salva mensagem no DB
    ▼
[PostgreSQL]
    │ Mensagem salva
    ▼
[Backend]
    │ Emite evento WebSocket
    ▼
[Socket.IO Server]
    │ Broadcast para sala "ticket:123"
    ▼
[Atendentes Online]
    │ Recebem nova mensagem
    │ Atualizam UI
    ▼
[Notificação Desktop]
```

### Fluxo 2: Atendente Envia Mensagem

```
[Atendente Frontend]
    │ Digita mensagem
    │ Clica "Enviar"
    ▼
[WebSocket Client]
    │ socket.emit('mensagem:enviar', {...})
    ▼
[Socket.IO Server]
    │ Recebe evento
    ▼
[Backend Gateway]
    │ Valida dados
    │ Salva mensagem no DB
    ▼
[PostgreSQL]
    │ Mensagem salva
    ▼
[Backend]
    │ Enfileira job WhatsApp
    ▼
[Bull Queue]
    │ Processa job
    │ Envia via Meta Cloud API
    ▼
[WhatsApp Cloud API]
    │ Entrega mensagem
    ▼
[Cliente WhatsApp]
    │ Recebe mensagem
```

### Fluxo 3: Indicador "Digitando..."

```
[Atendente A]
    │ Começa a digitar
    │ (debounce 300ms)
    ▼
[WebSocket Client A]
    │ socket.emit('usuario:digitando', { ticketId, nome })
    ▼
[Socket.IO Server]
    │ Recebe evento
    │ Broadcast para sala (exceto remetente)
    ▼
[WebSocket Client B, C, D...]
    │ Recebem evento 'usuario_digitando'
    ▼
[Frontend Atendentes B, C, D]
    │ Exibem "João está digitando..."
    │ (timeout 3s)
    ▼
[Indicador desaparece]
```

---

## 🗄️ Banco de Dados

### Schema Simplificado

```sql
-- Empresas (Multi-tenancy)
CREATE TABLE empresas (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Atendentes
CREATE TABLE atendentes (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Filas
CREATE TABLE atendimento_filas (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tickets
CREATE TABLE atendimento_tickets (
  id UUID PRIMARY KEY,
  numero INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  prioridade VARCHAR(50) NOT NULL,
  contato_nome VARCHAR(255) NOT NULL,
  contato_telefone VARCHAR(50),
  contato_email VARCHAR(255),
  assunto VARCHAR(500),
  empresa_id UUID REFERENCES empresas(id),
  atendente_id UUID REFERENCES atendentes(id),
  fila_id UUID REFERENCES atendimento_filas(id),
  canal_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  data_primeira_resposta TIMESTAMP,
  data_resolucao TIMESTAMP,
  data_fechamento TIMESTAMP,
  UNIQUE(empresa_id, numero)
);

-- Mensagens
CREATE TABLE atendimento_mensagens (
  id UUID PRIMARY KEY,
  conteudo TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  direcao VARCHAR(50) NOT NULL,
  arquivo_url VARCHAR(500),
  arquivo_nome VARCHAR(255),
  remetente_id UUID REFERENCES atendentes(id),
  ticket_id UUID REFERENCES atendimento_tickets(id),
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para Performance
CREATE INDEX idx_tickets_empresa_status ON atendimento_tickets(empresa_id, status);
CREATE INDEX idx_tickets_atendente ON atendimento_tickets(atendente_id);
CREATE INDEX idx_mensagens_ticket ON atendimento_mensagens(ticket_id);
CREATE INDEX idx_mensagens_created_at ON atendimento_mensagens(created_at DESC);
```

### Queries Comuns Otimizadas

```sql
-- Listar tickets de um atendente com última mensagem
SELECT 
  t.id,
  t.numero,
  t.status,
  t.contato_nome,
  t.created_at,
  (SELECT m.conteudo 
   FROM atendimento_mensagens m 
   WHERE m.ticket_id = t.id 
   ORDER BY m.created_at DESC 
   LIMIT 1) AS ultima_mensagem
FROM atendimento_tickets t
WHERE t.atendente_id = :atendenteId
  AND t.empresa_id = :empresaId
  AND t.status IN ('ABERTO', 'EM_ANDAMENTO')
ORDER BY t.created_at DESC;

-- Buscar mensagens de um ticket (paginação)
SELECT * FROM atendimento_mensagens
WHERE ticket_id = :ticketId
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
```

---

## 🔌 Integrações Externas

### WhatsApp Cloud API

```typescript
// backend/src/modules/whatsapp/services/whatsapp.service.ts
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly apiUrl = 'https://graph.facebook.com/v21.0';
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  async enviarMensagem(to: string, message: string) {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''), // Apenas números
      type: 'text',
      text: { body: message },
    };

    const response = await axios.post(
      `${this.apiUrl}/${this.phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  async enviarArquivo(to: string, fileUrl: string, caption?: string) {
    // Implementar envio de imagem/documento/áudio
  }

  processarWebhook(payload: any) {
    // Processar mensagens recebidas do WhatsApp
    const entry = payload.entry[0];
    const changes = entry.changes[0];
    const value = changes.value;

    if (value.messages) {
      const message = value.messages[0];
      return {
        from: message.from,
        text: message.text?.body,
        type: message.type,
        timestamp: message.timestamp,
      };
    }
  }
}
```

---

## 📈 Escalabilidade

### Horizontal Scaling (Redis Pub/Sub)

```typescript
// backend/src/config/socket.config.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export async function configureSocketIO(server: any) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  server.adapter(createAdapter(pubClient, subClient));
}
```

### Load Balancer (NGINX)

```nginx
upstream backend {
    least_conn;
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 🔒 Segurança

### Autenticação JWT

```typescript
// backend/src/common/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### Isolamento Multi-tenancy

```typescript
// backend/src/common/interceptors/tenant.interceptor.ts
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Adicionar empresaId automaticamente em todas as queries
    request.body.empresaId = user.empresaId;

    return next.handle();
  }
}
```

---

**Documento vivo**: Atualizar esta arquitetura conforme evolução do sistema.

**Última atualização**: 11 de dezembro de 2025  
**Responsável**: Equipe de Arquitetura ConectCRM
