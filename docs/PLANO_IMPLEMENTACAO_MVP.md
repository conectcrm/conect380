# 🚀 Plano de Implementação - MVP Atendimento Omnichannel

**Objetivo**: Sistema funcional de atendimento omnichannel em **6 semanas**  
**Status**: 📋 Planejamento  
**Data**: 12 de outubro de 2025

---

## 🎯 Definição do MVP

### O que o MVP deve fazer:
1. ✅ Receber mensagens WhatsApp (webhook) - **JÁ FUNCIONA!**
2. 🔴 Criar tickets automaticamente
3. 🔴 Salvar histórico de mensagens
4. 🔴 Interface web para atendentes visualizarem tickets
5. 🔴 Atendentes responderem pelo sistema
6. 🔴 WebSocket para atualização em tempo real
7. 🟡 Auto-resposta IA básica (opcional)

### O que o MVP NÃO precisa ter:
- ❌ Múltiplos canais (só WhatsApp)
- ❌ Filas e distribuição avançada
- ❌ Templates complexos
- ❌ Relatórios e dashboards
- ❌ SLA e alertas
- ❌ Workflows avançados

---

## 📅 SPRINT 1 (Semana 1) - "Fundação de Dados"

### 🎯 Objetivo: Criar estrutura do banco de dados

### 📝 Tarefas:

#### 1. Criar Migration: Tabela de Atendentes
**Arquivo**: `backend/src/database/migrations/YYYYMMDDHHMMSS-create-atendentes.ts`

```sql
CREATE TABLE atendimento_atendentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'offline', -- online, offline, ausente
    max_tickets INTEGER DEFAULT 5,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_atendentes_usuario ON atendimento_atendentes(usuario_id);
CREATE INDEX idx_atendentes_status ON atendimento_atendentes(status);
```

---

#### 2. Criar Migration: Tabela de Tickets
**Arquivo**: `backend/src/database/migrations/YYYYMMDDHHMMSS-create-tickets.ts`

```sql
CREATE TABLE atendimento_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    numero INTEGER GENERATED ALWAYS AS IDENTITY,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    canal_id UUID NOT NULL REFERENCES canais(id),
    
    -- Cliente
    cliente_nome VARCHAR(255),
    cliente_numero VARCHAR(50) NOT NULL, -- Número WhatsApp
    cliente_email VARCHAR(255),
    cliente_metadata JSONB DEFAULT '{}',
    
    -- Status e Atribuição
    status VARCHAR(20) NOT NULL DEFAULT 'aberto', -- aberto, em_atendimento, aguardando, resolvido, fechado
    prioridade VARCHAR(20) DEFAULT 'media', -- baixa, media, alta, urgente
    atendente_id UUID REFERENCES atendimento_atendentes(id),
    atribuido_em TIMESTAMP,
    
    -- Assunto
    assunto VARCHAR(500),
    categoria VARCHAR(100),
    tags TEXT[],
    
    -- Controle
    primeira_resposta_em TIMESTAMP,
    tempo_primeira_resposta INTEGER, -- segundos
    resolvido_em TIMESTAMP,
    fechado_em TIMESTAMP,
    reaberto_count INTEGER DEFAULT 0,
    
    -- IA
    auto_resposta_ativa BOOLEAN DEFAULT true,
    sentimento VARCHAR(20), -- positivo, neutro, negativo
    
    -- Metadata
    origem VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_canal FOREIGN KEY (canal_id) REFERENCES canais(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_tickets_empresa ON atendimento_tickets(empresa_id);
CREATE INDEX idx_tickets_canal ON atendimento_tickets(canal_id);
CREATE INDEX idx_tickets_cliente_numero ON atendimento_tickets(cliente_numero);
CREATE INDEX idx_tickets_status ON atendimento_tickets(status);
CREATE INDEX idx_tickets_atendente ON atendimento_tickets(atendente_id);
CREATE INDEX idx_tickets_created ON atendimento_tickets(created_at DESC);
CREATE INDEX idx_tickets_numero ON atendimento_tickets(numero);

-- Índice para busca full-text
CREATE INDEX idx_tickets_busca ON atendimento_tickets USING gin(to_tsvector('portuguese', coalesce(assunto, '') || ' ' || coalesce(cliente_nome, '')));
```

---

#### 3. Criar Migration: Tabela de Mensagens
**Arquivo**: `backend/src/database/migrations/YYYYMMDDHHMMSS-create-mensagens.ts`

```sql
CREATE TABLE atendimento_mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamento
    ticket_id UUID NOT NULL REFERENCES atendimento_tickets(id) ON DELETE CASCADE,
    
    -- Identificação
    message_id VARCHAR(255), -- ID externo (WhatsApp, etc)
    tipo VARCHAR(20) NOT NULL, -- recebida, enviada, nota, sistema
    
    -- Remetente
    remetente_tipo VARCHAR(20) NOT NULL, -- cliente, atendente, sistema, bot
    atendente_id UUID REFERENCES atendimento_atendentes(id),
    
    -- Conteúdo
    conteudo TEXT NOT NULL,
    formato VARCHAR(20) DEFAULT 'text', -- text, image, video, audio, document, location
    midia_url TEXT,
    midia_tipo VARCHAR(50),
    midia_tamanho INTEGER,
    
    -- Status
    entregue BOOLEAN DEFAULT false,
    entregue_em TIMESTAMP,
    lida BOOLEAN DEFAULT false,
    lida_em TIMESTAMP,
    
    -- IA
    gerada_por_ia BOOLEAN DEFAULT false,
    ia_model VARCHAR(50),
    ia_confidence DECIMAL(5,2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_ticket FOREIGN KEY (ticket_id) REFERENCES atendimento_tickets(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_mensagens_ticket ON atendimento_mensagens(ticket_id);
CREATE INDEX idx_mensagens_created ON atendimento_mensagens(created_at);
CREATE INDEX idx_mensagens_tipo ON atendimento_mensagens(tipo);
CREATE INDEX idx_mensagens_message_id ON atendimento_mensagens(message_id);

-- Índice para busca full-text
CREATE INDEX idx_mensagens_busca ON atendimento_mensagens USING gin(to_tsvector('portuguese', conteudo));
```

---

#### 4. Criar Entities TypeORM

**Arquivo**: `backend/src/modules/atendimento/entities/atendente.entity.ts`
```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Ticket } from './ticket.entity';

@Entity('atendimento_atendentes')
export class Atendente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @ManyToOne(() => Usuario)
  usuario: Usuario;

  @Column()
  nome: string;

  @Column()
  email: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ default: 'offline' })
  status: 'online' | 'offline' | 'ausente';

  @Column({ name: 'max_tickets', default: 5 })
  maxTickets: number;

  @Column({ default: true })
  ativo: boolean;

  @OneToMany(() => Ticket, ticket => ticket.atendente)
  tickets: Ticket[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Arquivo**: `backend/src/modules/atendimento/entities/ticket.entity.ts`
```typescript
import { Entity, Column, PrimaryGeneratedColumn, Generated, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Canal } from '../../canais/entities/canal.entity';
import { Atendente } from './atendente.entity';
import { Mensagem } from './mensagem.entity';

@Entity('atendimento_tickets')
@Index(['empresaId', 'status'])
@Index(['clienteNumero'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Generated('increment')
  @Column()
  numero: number;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  empresa: Empresa;

  @Column({ name: 'canal_id' })
  canalId: string;

  @ManyToOne(() => Canal)
  canal: Canal;

  // Cliente
  @Column({ name: 'cliente_nome', nullable: true })
  clienteNome?: string;

  @Column({ name: 'cliente_numero' })
  clienteNumero: string;

  @Column({ name: 'cliente_email', nullable: true })
  clienteEmail?: string;

  @Column({ name: 'cliente_metadata', type: 'jsonb', default: {} })
  clienteMetadata: Record<string, any>;

  // Status
  @Column({ default: 'aberto' })
  status: 'aberto' | 'em_atendimento' | 'aguardando' | 'resolvido' | 'fechado';

  @Column({ default: 'media' })
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';

  @Column({ name: 'atendente_id', nullable: true })
  atendenteId?: string;

  @ManyToOne(() => Atendente, atendente => atendente.tickets)
  atendente?: Atendente;

  @Column({ name: 'atribuido_em', nullable: true })
  atribuidoEm?: Date;

  // Assunto
  @Column({ nullable: true })
  assunto?: string;

  @Column({ nullable: true })
  categoria?: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  // Controle
  @Column({ name: 'primeira_resposta_em', nullable: true })
  primeiraRespostaEm?: Date;

  @Column({ name: 'tempo_primeira_resposta', nullable: true })
  tempoPrimeiraResposta?: number;

  @Column({ name: 'resolvido_em', nullable: true })
  resolvidoEm?: Date;

  @Column({ name: 'fechado_em', nullable: true })
  fechadoEm?: Date;

  @Column({ name: 'reaberto_count', default: 0 })
  reabertoCount: number;

  // IA
  @Column({ name: 'auto_resposta_ativa', default: true })
  autoRespostaAtiva: boolean;

  @Column({ nullable: true })
  sentimento?: 'positivo' | 'neutro' | 'negativo';

  // Metadata
  @Column({ default: 'whatsapp' })
  origem: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @OneToMany(() => Mensagem, mensagem => mensagem.ticket, { cascade: true })
  mensagens: Mensagem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Arquivo**: `backend/src/modules/atendimento/entities/mensagem.entity.ts`
```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Ticket } from './ticket.entity';
import { Atendente } from './atendente.entity';

@Entity('atendimento_mensagens')
@Index(['ticketId', 'createdAt'])
export class Mensagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id' })
  ticketId: string;

  @ManyToOne(() => Ticket, ticket => ticket.mensagens, { onDelete: 'CASCADE' })
  ticket: Ticket;

  @Column({ name: 'message_id', nullable: true })
  messageId?: string;

  @Column()
  tipo: 'recebida' | 'enviada' | 'nota' | 'sistema';

  @Column({ name: 'remetente_tipo' })
  remetenteTipo: 'cliente' | 'atendente' | 'sistema' | 'bot';

  @Column({ name: 'atendente_id', nullable: true })
  atendenteId?: string;

  @ManyToOne(() => Atendente, { nullable: true })
  atendente?: Atendente;

  @Column('text')
  conteudo: string;

  @Column({ default: 'text' })
  formato: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';

  @Column({ name: 'midia_url', nullable: true })
  midiaUrl?: string;

  @Column({ name: 'midia_tipo', nullable: true })
  midiaTipo?: string;

  @Column({ name: 'midia_tamanho', nullable: true })
  midiaTamanho?: number;

  @Column({ default: false })
  entregue: boolean;

  @Column({ name: 'entregue_em', nullable: true })
  entregueEm?: Date;

  @Column({ default: false })
  lida: boolean;

  @Column({ name: 'lida_em', nullable: true })
  lidaEm?: Date;

  @Column({ name: 'gerada_por_ia', default: false })
  geradaPorIa: boolean;

  @Column({ name: 'ia_model', nullable: true })
  iaModel?: string;

  @Column({ name: 'ia_confidence', type: 'decimal', precision: 5, scale: 2, nullable: true })
  iaConfidence?: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

#### 5. Testar Migrations

```bash
# Rodar migrations
npm run typeorm migration:run

# Verificar tabelas criadas
psql -U conectcrm -d conectcrm_db -c "\dt atendimento_*"
```

---

### ✅ Critério de Conclusão Sprint 1:
- [ ] Todas as 3 migrations criadas e rodadas com sucesso
- [ ] 3 entities TypeORM criadas (Atendente, Ticket, Mensagem)
- [ ] Tabelas visíveis no banco de dados
- [ ] Documentação atualizada

---

## 📅 SPRINT 2 (Semana 2) - "Services Core"

### 🎯 Objetivo: Implementar lógica de negócio

### 📝 Tarefas:

#### 1. Implementar TicketService

**Arquivo**: `backend/src/modules/atendimento/services/ticket.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';

export interface CriarTicketDto {
  empresaId: string;
  canalId: string;
  clienteNumero: string;
  clienteNome?: string;
  assunto?: string;
  origem?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  /**
   * Busca ou cria um ticket ativo para o cliente
   */
  async buscarOuCriarTicket(dados: CriarTicketDto): Promise<Ticket> {
    // 1. Buscar ticket aberto do cliente
    let ticket = await this.ticketRepository.findOne({
      where: {
        empresaId: dados.empresaId,
        canalId: dados.canalId,
        clienteNumero: dados.clienteNumero,
        status: In(['aberto', 'em_atendimento', 'aguardando']),
      },
      relations: ['atendente', 'mensagens'],
      order: { createdAt: 'DESC' },
    });

    // 2. Se não existir, criar novo
    if (!ticket) {
      ticket = this.ticketRepository.create({
        empresaId: dados.empresaId,
        canalId: dados.canalId,
        clienteNumero: dados.clienteNumero,
        clienteNome: dados.clienteNome,
        assunto: dados.assunto || 'Novo atendimento',
        origem: dados.origem || 'whatsapp',
        status: 'aberto',
        autoRespostaAtiva: true,
        metadata: dados.metadata || {},
      });

      ticket = await this.ticketRepository.save(ticket);
    }

    return ticket;
  }

  /**
   * Busca ticket por ID
   */
  async buscarPorId(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['atendente', 'canal', 'mensagens'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} não encontrado`);
    }

    return ticket;
  }

  /**
   * Lista tickets com filtros
   */
  async listar(filtros: {
    empresaId: string;
    status?: string[];
    atendenteId?: string;
    limite?: number;
    pagina?: number;
  }): Promise<{ tickets: Ticket[]; total: number }> {
    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.atendente', 'atendente')
      .leftJoinAndSelect('ticket.canal', 'canal')
      .where('ticket.empresaId = :empresaId', { empresaId: filtros.empresaId });

    if (filtros.status && filtros.status.length > 0) {
      queryBuilder.andWhere('ticket.status IN (:...status)', { status: filtros.status });
    }

    if (filtros.atendenteId) {
      queryBuilder.andWhere('ticket.atendenteId = :atendenteId', {
        atendenteId: filtros.atendenteId,
      });
    }

    queryBuilder.orderBy('ticket.createdAt', 'DESC');

    const limite = filtros.limite || 50;
    const pagina = filtros.pagina || 1;
    const skip = (pagina - 1) * limite;

    const [tickets, total] = await queryBuilder
      .take(limite)
      .skip(skip)
      .getManyAndCount();

    return { tickets, total };
  }

  /**
   * Atribui ticket a um atendente
   */
  async atribuir(ticketId: string, atendenteId: string): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    ticket.atendenteId = atendenteId;
    ticket.atribuidoEm = new Date();
    ticket.status = 'em_atendimento';

    return await this.ticketRepository.save(ticket);
  }

  /**
   * Atualiza status do ticket
   */
  async atualizarStatus(
    ticketId: string,
    status: 'aberto' | 'em_atendimento' | 'aguardando' | 'resolvido' | 'fechado',
  ): Promise<Ticket> {
    const ticket = await this.buscarPorId(ticketId);

    ticket.status = status;

    if (status === 'resolvido') {
      ticket.resolvidoEm = new Date();
    }

    if (status === 'fechado') {
      ticket.fechadoEm = new Date();
    }

    return await this.ticketRepository.save(ticket);
  }
}
```

---

#### 2. Implementar MensagemService

**Arquivo**: `backend/src/modules/atendimento/services/mensagem.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensagem } from '../entities/mensagem.entity';

export interface CriarMensagemDto {
  ticketId: string;
  tipo: 'recebida' | 'enviada' | 'nota' | 'sistema';
  remetenteTipo: 'cliente' | 'atendente' | 'sistema' | 'bot';
  atendenteId?: string;
  conteudo: string;
  formato?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  messageId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class MensagemService {
  constructor(
    @InjectRepository(Mensagem)
    private mensagemRepository: Repository<Mensagem>,
  ) {}

  /**
   * Salva uma nova mensagem
   */
  async salvar(dados: CriarMensagemDto): Promise<Mensagem> {
    const mensagem = this.mensagemRepository.create({
      ticketId: dados.ticketId,
      tipo: dados.tipo,
      remetenteTipo: dados.remetenteTipo,
      atendenteId: dados.atendenteId,
      conteudo: dados.conteudo,
      formato: dados.formato || 'text',
      messageId: dados.messageId,
      metadata: dados.metadata || {},
    });

    return await this.mensagemRepository.save(mensagem);
  }

  /**
   * Busca mensagens de um ticket
   */
  async buscarPorTicket(ticketId: string, limite = 100): Promise<Mensagem[]> {
    return await this.mensagemRepository.find({
      where: { ticketId },
      relations: ['atendente'],
      order: { createdAt: 'ASC' },
      take: limite,
    });
  }

  /**
   * Marca mensagem como lida
   */
  async marcarComoLida(messageId: string): Promise<void> {
    await this.mensagemRepository.update(
      { messageId },
      { lida: true, lidaEm: new Date() },
    );
  }

  /**
   * Marca mensagem como entregue
   */
  async marcarComoEntregue(messageId: string): Promise<void> {
    await this.mensagemRepository.update(
      { messageId },
      { entregue: true, entregueEm: new Date() },
    );
  }
}
```

---

#### 3. Integrar com WhatsApp Webhook

**Arquivo**: `whatsapp-webhook.service.ts` (ATUALIZAR)

```typescript
async processar(empresaId: string, payload: any): Promise<void> {
  try {
    // 1. Extrair dados da mensagem
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return;
    }

    const message = messages[0];
    const from = message.from;
    const text = message.text?.body || '[Mídia]';
    const messageId = message.id;

    // 2. Buscar configuração do canal
    const phoneNumberId = value?.metadata?.phone_number_id;
    const canal = await this.canaisService.buscarPorPhoneNumberId(phoneNumberId);

    // 3. Buscar ou criar ticket
    const ticket = await this.ticketService.buscarOuCriarTicket({
      empresaId,
      canalId: canal.id,
      clienteNumero: from,
      clienteNome: value?.contacts?.[0]?.profile?.name,
      assunto: text.substring(0, 100),
      origem: 'whatsapp',
    });

    this.logger.log(`✅ Ticket criado/encontrado: ${ticket.id} (Número: ${ticket.numero})`);

    // 4. Salvar mensagem
    const mensagem = await this.mensagemService.salvar({
      ticketId: ticket.id,
      tipo: 'recebida',
      remetenteTipo: 'cliente',
      conteudo: text,
      formato: 'text',
      messageId,
      metadata: { whatsapp: message },
    });

    this.logger.log(`✅ Mensagem salva: ${mensagem.id}`);

    // 5. Verificar auto-resposta IA (se configurada)
    if (ticket.autoRespostaAtiva) {
      const configIA = await this.buscarConfiguracaoIA(empresaId);
      if (configIA?.ativo) {
        // TODO: Implementar AIService
        this.logger.log(`🤖 Auto-resposta IA ativada (em desenvolvimento)`);
      }
    }

    // 6. Marcar como lida
    await this.senderService.marcarComoLida(empresaId, phoneNumberId, messageId);

    // 7. Notificar atendentes via WebSocket (TODO)
    // this.websocketGateway.notificarNovaMensagem(ticket, mensagem);

  } catch (error) {
    this.logger.error(`❌ Erro ao processar webhook: ${error.message}`, error.stack);
  }
}
```

---

#### 4. Criar AtendenteService Básico

**Arquivo**: `backend/src/modules/atendimento/services/atendente.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Atendente } from '../entities/atendente.entity';

@Injectable()
export class AtendenteService {
  constructor(
    @InjectRepository(Atendente)
    private atendenteRepository: Repository<Atendente>,
  ) {}

  async listar(empresaId: string): Promise<Atendente[]> {
    return await this.atendenteRepository.find({
      where: { ativo: true },
      order: { nome: 'ASC' },
    });
  }

  async buscarPorUsuario(usuarioId: string): Promise<Atendente | null> {
    return await this.atendenteRepository.findOne({
      where: { usuarioId },
    });
  }

  async atualizarStatus(
    atendenteId: string,
    status: 'online' | 'offline' | 'ausente',
  ): Promise<Atendente> {
    await this.atendenteRepository.update(atendenteId, { status });
    return await this.atendenteRepository.findOne({ where: { id: atendenteId } });
  }
}
```

---

### ✅ Critério de Conclusão Sprint 2:
- [ ] TicketService implementado e testado
- [ ] MensagemService implementado e testado
- [ ] AtendenteService básico criado
- [ ] Webhook integrado com tickets/mensagens
- [ ] Teste manual: enviar mensagem WhatsApp e ver ticket criado no banco

---

## 📅 SPRINT 3 (Semana 3) - "API REST"

### 🎯 Objetivo: Criar endpoints para frontend consumir

### 📝 Tarefas:

#### 1. Criar TicketsController

**Arquivo**: `backend/src/modules/atendimento/controllers/tickets.controller.ts`

```typescript
import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TicketService } from '../services/ticket.service';

@Controller('api/atendimento/tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private ticketService: TicketService) {}

  @Get()
  async listar(
    @CurrentUser() user,
    @Query('status') status?: string,
    @Query('atendenteId') atendenteId?: string,
    @Query('pagina') pagina?: number,
  ) {
    const statusArray = status ? status.split(',') : undefined;
    
    return await this.ticketService.listar({
      empresaId: user.empresaId,
      status: statusArray,
      atendenteId,
      pagina: Number(pagina) || 1,
      limite: 50,
    });
  }

  @Get(':id')
  async buscar(@Param('id') id: string) {
    return await this.ticketService.buscarPorId(id);
  }

  @Patch(':id/atribuir')
  async atribuir(
    @Param('id') id: string,
    @Body('atendenteId') atendenteId: string,
  ) {
    return await this.ticketService.atribuir(id, atendenteId);
  }

  @Patch(':id/status')
  async atualizarStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return await this.ticketService.atualizarStatus(id, status as any);
  }
}
```

---

#### 2. Criar MensagensController

**Arquivo**: `backend/src/modules/atendimento/controllers/mensagens.controller.ts`

```typescript
import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MensagemService } from '../services/mensagem.service';
import { WhatsAppSenderService } from '../services/whatsapp-sender.service';

@Controller('api/atendimento/tickets/:ticketId/mensagens')
@UseGuards(JwtAuthGuard)
export class MensagensController {
  constructor(
    private mensagemService: MensagemService,
    private whatsappSender: WhatsAppSenderService,
  ) {}

  @Get()
  async listar(@Param('ticketId') ticketId: string) {
    return await this.mensagemService.buscarPorTicket(ticketId);
  }

  @Post()
  async enviar(
    @Param('ticketId') ticketId: string,
    @Body('conteudo') conteudo: string,
    @Body('atendenteId') atendenteId: string,
  ) {
    // 1. Buscar ticket para pegar número do cliente
    const ticket = await this.ticketService.buscarPorId(ticketId);

    // 2. Enviar via WhatsApp
    const waMessage = await this.whatsappSender.enviarMensagem(
      ticket.empresaId,
      ticket.clienteNumero,
      conteudo,
    );

    // 3. Salvar no banco
    const mensagem = await this.mensagemService.salvar({
      ticketId,
      tipo: 'enviada',
      remetenteTipo: 'atendente',
      atendenteId,
      conteudo,
      messageId: waMessage.messages?.[0]?.id,
    });

    return mensagem;
  }
}
```

---

#### 3. Testar Endpoints

```bash
# Listar tickets
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/atendimento/tickets

# Buscar ticket específico
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/atendimento/tickets/UUID

# Buscar mensagens do ticket
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/atendimento/tickets/UUID/mensagens

# Enviar mensagem
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conteudo": "Olá! Como posso ajudar?", "atendenteId": "UUID"}' \
  http://localhost:3001/api/atendimento/tickets/UUID/mensagens
```

---

### ✅ Critério de Conclusão Sprint 3:
- [ ] TicketsController implementado
- [ ] MensagensController implementado
- [ ] Endpoints testados com Postman/curl
- [ ] Documentação Swagger atualizada

---

## 📅 SPRINT 4 (Semana 4) - "Frontend Base"

### 🎯 Objetivo: Interface para visualizar e responder tickets

### 📝 Tarefas:

#### 1. Criar Página de Atendimento

**Arquivo**: `frontend/src/pages/atendimento/index.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { TicketList } from './components/TicketList';
import { ChatWindow } from './components/ChatWindow';

export default function AtendimentoPage() {
  const [tickets, setTickets] = useState([]);
  const [ticketAtivo, setTicketAtivo] = useState(null);

  useEffect(() => {
    // Buscar tickets
    fetch('/api/atendimento/tickets', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTickets(data.tickets));
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar com lista de tickets */}
      <div className="w-1/3 border-r">
        <TicketList 
          tickets={tickets}
          onSelect={setTicketAtivo}
        />
      </div>

      {/* Chat */}
      <div className="flex-1">
        {ticketAtivo ? (
          <ChatWindow ticket={ticketAtivo} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Selecione um ticket
          </div>
        )}
      </div>
    </div>
  );
}
```

---

#### 2. Componente TicketList

**Arquivo**: `frontend/src/pages/atendimento/components/TicketList.tsx`

```tsx
import React from 'react';

interface Ticket {
  id: string;
  numero: number;
  clienteNome: string;
  clienteNumero: string;
  status: string;
  assunto: string;
  createdAt: string;
}

export function TicketList({ tickets, onSelect }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Tickets</h2>
      </div>

      {tickets.map(ticket => (
        <div
          key={ticket.id}
          onClick={() => onSelect(ticket)}
          className="p-4 border-b hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="font-medium">{ticket.clienteNome || ticket.clienteNumero}</div>
            <span className="text-xs text-gray-500">#{ticket.numero}</span>
          </div>
          
          <div className="text-sm text-gray-600 mt-1 truncate">
            {ticket.assunto}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs px-2 py-1 rounded ${getStatusClass(ticket.status)}`}>
              {ticket.status}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(ticket.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusClass(status: string) {
  const classes = {
    aberto: 'bg-blue-100 text-blue-800',
    em_atendimento: 'bg-yellow-100 text-yellow-800',
    resolvido: 'bg-green-100 text-green-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

---

#### 3. Componente ChatWindow

**Arquivo**: `frontend/src/pages/atendimento/components/ChatWindow.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';

export function ChatWindow({ ticket }) {
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Buscar mensagens
    fetch(`/api/atendimento/tickets/${ticket.id}/mensagens`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMensagens(data));
  }, [ticket.id]);

  useEffect(() => {
    // Auto-scroll para última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;

    const response = await fetch(`/api/atendimento/tickets/${ticket.id}/mensagens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conteudo: novaMensagem,
        atendenteId: currentUser.id,
      }),
    });

    const mensagem = await response.json();
    setMensagens([...mensagens, mensagem]);
    setNovaMensagem('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-bold">{ticket.clienteNome || ticket.clienteNumero}</h3>
        <p className="text-sm text-gray-600">Ticket #{ticket.numero}</p>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.tipo === 'enviada' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.tipo === 'enviada'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p>{msg.conteudo}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {formatDate(msg.createdAt)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={novaMensagem}
            onChange={e => setNovaMensagem(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && enviarMensagem()}
            placeholder="Digite sua mensagem..."
            className="flex-1 border rounded-lg px-4 py-2"
          />
          <button
            onClick={enviarMensagem}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### ✅ Critério de Conclusão Sprint 4:
- [ ] Página de atendimento funcional
- [ ] Lista de tickets visível
- [ ] Chat funcionando (visualizar e enviar)
- [ ] Interface responsiva

---

## 📅 SPRINT 5 (Semana 5) - "WebSocket Tempo Real"

### 🎯 Objetivo: Atualização em tempo real

### 📝 Tarefas:

#### 1. Implementar Gateway WebSocket

**Arquivo**: `backend/src/modules/atendimento/gateways/atendimento.gateway.ts`

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/atendimento' })
export class AtendimentoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private usuariosConectados = new Map<string, Socket>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.usuariosConectados.set(userId, client);
    console.log(`✅ Cliente conectado: ${userId}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.usuariosConectados.delete(userId);
    console.log(`❌ Cliente desconectado: ${userId}`);
  }

  notificarNovaMensagem(ticket: any, mensagem: any) {
    // Notificar todos os atendentes
    this.server.emit('nova-mensagem', { ticket, mensagem });
  }

  notificarAtualizacaoTicket(ticket: any) {
    this.server.emit('atualizacao-ticket', ticket);
  }
}
```

---

#### 2. Integrar WebSocket no Frontend

**Arquivo**: `frontend/src/hooks/useWebSocket.ts`

```tsx
import { useEffect } from 'react';
import io from 'socket.io-client';

export function useWebSocket() {
  useEffect(() => {
    const socket = io('http://localhost:3001/atendimento', {
      query: { userId: currentUser.id },
    });

    socket.on('nova-mensagem', ({ ticket, mensagem }) => {
      console.log('Nova mensagem:', mensagem);
      // Atualizar estado
      addMensagem(mensagem);
      
      // Notificação do browser
      if (Notification.permission === 'granted') {
        new Notification('Nova mensagem', {
          body: mensagem.conteudo,
        });
      }
    });

    socket.on('atualizacao-ticket', (ticket) => {
      console.log('Ticket atualizado:', ticket);
      updateTicket(ticket);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
}
```

---

### ✅ Critério de Conclusão Sprint 5:
- [ ] WebSocket Gateway implementado
- [ ] Frontend conectado ao WebSocket
- [ ] Notificações em tempo real funcionando
- [ ] Teste: enviar mensagem WhatsApp e ver aparecer na interface instantaneamente

---

## 📅 SPRINT 6 (Semana 6) - "IA e Testes"

### 🎯 Objetivo: Auto-resposta IA e testes finais

### 📝 Tarefas:

#### 1. Implementar AIService

**Arquivo**: `backend/src/modules/atendimento/services/ai.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  constructor(
    @InjectRepository(IntegracoesConfig)
    private configRepository: Repository<IntegracoesConfig>,
  ) {}

  async gerarResposta(ticket: any, historico: string[]): Promise<string | null> {
    // 1. Buscar config OpenAI
    const config = await this.configRepository.findOne({
      where: {
        empresaId: ticket.empresaId,
        tipo: 'openai',
        ativo: true,
      },
    });

    if (!config || !config.credenciais?.auto_responder) {
      return null;
    }

    // 2. Chamar OpenAI
    const openai = new OpenAI({
      apiKey: config.credenciais.api_key,
    });

    const response = await openai.chat.completions.create({
      model: config.credenciais.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente de atendimento ao cliente. Seja educado e prestativo.',
        },
        ...historico.map(msg => ({
          role: msg.tipo === 'recebida' ? 'user' : 'assistant',
          content: msg.conteudo,
        })),
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || null;
  }
}
```

---

#### 2. Integrar IA no Webhook

**Atualizar**: `whatsapp-webhook.service.ts`

```typescript
// Após salvar mensagem do cliente
if (ticket.autoRespostaAtiva) {
  const historico = await this.mensagemService.buscarPorTicket(ticket.id, 10);
  const resposta = await this.aiService.gerarResposta(ticket, historico);

  if (resposta) {
    // Enviar resposta
    await this.whatsappSender.enviarMensagem(
      empresaId,
      ticket.clienteNumero,
      resposta,
    );

    // Salvar no banco
    await this.mensagemService.salvar({
      ticketId: ticket.id,
      tipo: 'enviada',
      remetenteTipo: 'bot',
      conteudo: resposta,
      geradaPorIa: true,
      iaModel: 'gpt-4o-mini',
    });

    this.logger.log(`🤖 Resposta IA enviada: ${resposta}`);
  }
}
```

---

#### 3. Testes End-to-End

**Cenário 1: Mensagem → Ticket → IA → Resposta**
```
1. Enviar "Olá" pelo WhatsApp
2. Verificar ticket criado no banco
3. Verificar mensagem salva
4. Verificar resposta IA automática
5. Verificar resposta no WhatsApp
```

**Cenário 2: Atendente Responde**
```
1. Atendente abre ticket na interface
2. Visualiza histórico
3. Envia resposta
4. Cliente recebe no WhatsApp
5. WebSocket notifica em tempo real
```

---

### ✅ Critério de Conclusão Sprint 6:
- [ ] AIService implementado
- [ ] Auto-resposta funcionando
- [ ] Testes E2E passando
- [ ] Documentação atualizada

---

## 🎉 RESULTADO ESPERADO (Fim da Semana 6)

### ✅ MVP Completo com:
1. ✅ Webhook WhatsApp recebendo mensagens
2. ✅ Tickets criados automaticamente
3. ✅ Histórico salvo no banco
4. ✅ Interface web para atendentes
5. ✅ Chat em tempo real (WebSocket)
6. ✅ Atendentes podem responder
7. ✅ Auto-resposta IA (opcional)

### 📊 Métricas de Sucesso:
- [ ] Cliente envia mensagem → Ticket criado em <1s
- [ ] Atendente vê nova mensagem em tempo real
- [ ] Resposta do atendente chega no WhatsApp em <2s
- [ ] Interface responsiva e intuitiva
- [ ] Zero erros 500 nos endpoints
- [ ] 100% das mensagens salvas no banco

---

## 📚 Documentação a Criar:

1. **README_ATENDIMENTO.md** - Como usar o sistema
2. **API_ENDPOINTS.md** - Documentação da API
3. **DATABASE_SCHEMA.md** - Estrutura do banco
4. **DEPLOY_GUIDE.md** - Como fazer deploy

---

## 🔄 Próximas Iterações (Pós-MVP):

### Versão 1.1 (Semana 7-8):
- [ ] Filas de atendimento
- [ ] Distribuição automática
- [ ] Templates de resposta
- [ ] Relatórios básicos

### Versão 1.2 (Semana 9-10):
- [ ] Email como canal
- [ ] Telegram
- [ ] SLA e alertas

### Versão 2.0 (Semana 11-12):
- [ ] Análise de sentimento
- [ ] Predição de churn
- [ ] Workflows avançados

---

## 📞 Suporte

**Dúvidas durante implementação?**
- Consultar documentação em `/docs`
- Ver exemplos de código existente
- Testar com Postman antes de integrar frontend

**Problemas?**
- Verificar logs do backend
- Usar `console.log` estratégico
- Debugger do VSCode

---

**Data de Criação**: 12 de outubro de 2025  
**Versão**: 1.0  
**Status**: 📋 Pronto para Implementação
