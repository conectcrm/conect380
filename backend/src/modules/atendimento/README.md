# 📖 Módulo Atendimento - Backend

**Localização**: `backend/src/modules/atendimento/`  
**Versão**: 1.0.0  
**Última Atualização**: 11 de dezembro de 2025

---

## 🎯 Visão Geral

Módulo backend responsável pela lógica de negócio do sistema de atendimento omnichannel do ConectCRM. Gerencia tickets, mensagens, atendentes, filas e integração com canais externos (WhatsApp, Email, etc.).

### Features Implementadas

- ✅ CRUD completo de tickets
- ✅ CRUD completo de mensagens
- ✅ WebSocket Gateway (comunicação realtime)
- ✅ Distribuição automática de tickets por filas
- ✅ Sistema de status online/offline de atendentes
- ✅ Integração WhatsApp Business API
- ✅ Filas de processamento (Bull + Redis)
- ✅ Multi-tenancy (isolamento por empresa)

---

## 📁 Estrutura de Pastas

```
atendimento/
├── entities/                      # Entidades TypeORM
│   ├── ticket.entity.ts
│   ├── mensagem.entity.ts
│   ├── atendente.entity.ts
│   ├── fila.entity.ts
│   ├── canal.entity.ts
│   └── equipe.entity.ts
│
├── dto/                           # Data Transfer Objects
│   ├── create-ticket.dto.ts
│   ├── update-ticket.dto.ts
│   ├── send-mensagem.dto.ts
│   ├── assign-ticket.dto.ts
│   └── transfer-ticket.dto.ts
│
├── services/                      # Lógica de negócio
│   ├── ticket.service.ts
│   ├── mensagem.service.ts
│   ├── distribuicao.service.ts
│   ├── online-status.service.ts
│   ├── metrics.service.ts
│   └── sla.service.ts
│
├── controllers/                   # Rotas HTTP
│   ├── ticket.controller.ts
│   ├── mensagem.controller.ts
│   ├── atendente.controller.ts
│   ├── fila.controller.ts
│   └── canal.controller.ts
│
├── gateways/                      # WebSocket gateways
│   └── atendimento.gateway.ts
│
├── queues/                        # Filas de background
│   ├── whatsapp.queue.ts
│   ├── notification.queue.ts
│   └── processors/
│       ├── whatsapp.processor.ts
│       └── notification.processor.ts
│
├── guards/                        # Guards de autenticação
│   └── ws-jwt.guard.ts
│
├── tests/                         # Testes
│   ├── integration/
│   │   ├── ticket.integration.spec.ts
│   │   └── websocket.integration.spec.ts
│   └── unit/
│       └── ticket.service.spec.ts
│
└── atendimento.module.ts          # Módulo raiz
```

---

## 🚀 Como Usar

### Registrar no App Module

```typescript
// backend/src/app.module.ts
import { AtendimentoModule } from './modules/atendimento/atendimento.module';

@Module({
  imports: [
    AtendimentoModule,
    // ... outros módulos
  ],
})
export class AppModule {}
```

### Variáveis de Ambiente Necessárias

```bash
# .env

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=sua_senha
DATABASE_NAME=conectcrm

# Redis (cache + pub/sub)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=sua_chave_secreta
JWT_EXPIRATION=7d

# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=seu_token
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu_verify_token

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

---

## 📡 Endpoints da API

### Tickets

#### `GET /atendimento/tickets`
Listar tickets com filtros.

**Query Params**:
- `empresaId` (required): ID da empresa
- `status` (optional): ABERTO, EM_ANDAMENTO, PENDENTE, RESOLVIDO, FECHADO
- `atendenteId` (optional): Filtrar por atendente
- `filaId` (optional): Filtrar por fila
- `page` (optional): Página (padrão: 1)
- `limit` (optional): Items por página (padrão: 20)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "numero": 123,
      "status": "ABERTO",
      "prioridade": "NORMAL",
      "contato_nome": "João Silva",
      "contato_telefone": "5511999998888",
      "empresaId": "uuid",
      "atendenteId": "uuid",
      "filaId": "uuid",
      "createdAt": "2025-12-11T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 3
}
```

---

#### `GET /atendimento/tickets/:id`
Buscar ticket por ID.

**Response**:
```json
{
  "id": "uuid",
  "numero": 123,
  "status": "ABERTO",
  "contato_nome": "João Silva",
  "mensagens": [
    {
      "id": "uuid",
      "conteudo": "Olá!",
      "tipo": "texto",
      "direcao": "recebida",
      "createdAt": "2025-12-11T10:05:00Z"
    }
  ],
  "atendente": {
    "id": "uuid",
    "nome": "Maria Santos",
    "email": "maria@empresa.com"
  }
}
```

---

#### `POST /atendimento/tickets`
Criar novo ticket.

**Body**:
```json
{
  "contato_nome": "João Silva",
  "contato_telefone": "5511999998888",
  "contato_email": "joao@example.com",
  "assunto": "Dúvida sobre produto",
  "empresaId": "uuid",
  "filaId": "uuid",
  "canalId": "uuid",
  "prioridade": "NORMAL"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "numero": 124,
  "status": "ABERTO",
  "contato_nome": "João Silva",
  "createdAt": "2025-12-11T11:00:00Z"
}
```

---

#### `PATCH /atendimento/tickets/:id`
Atualizar ticket.

**Body**:
```json
{
  "status": "EM_ANDAMENTO",
  "prioridade": "ALTA",
  "assunto": "Atualizado"
}
```

**Response**: `200 OK`

---

#### `PATCH /atendimento/tickets/:id/atribuir`
Atribuir ticket a um atendente.

**Body**:
```json
{
  "atendenteId": "uuid"
}
```

**Response**: `200 OK`

---

#### `PATCH /atendimento/tickets/:id/transferir`
Transferir ticket para outra fila ou atendente.

**Body**:
```json
{
  "filaId": "uuid",
  "atendenteId": "uuid",
  "motivo": "Cliente solicitou gerente"
}
```

**Response**: `200 OK`

---

### Mensagens

#### `GET /atendimento/tickets/:ticketId/mensagens`
Listar mensagens de um ticket.

**Query Params**:
- `page` (optional): Página
- `limit` (optional): Items por página

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "conteudo": "Olá, como posso ajudar?",
      "tipo": "texto",
      "direcao": "enviada",
      "remetenteId": "uuid",
      "ticketId": "uuid",
      "lida": true,
      "createdAt": "2025-12-11T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1
}
```

---

#### `POST /atendimento/mensagens`
Enviar nova mensagem.

**Body**:
```json
{
  "ticketId": "uuid",
  "conteudo": "Olá! Como posso ajudar?",
  "tipo": "texto",
  "direcao": "enviada"
}
```

**Response**: `201 Created`

---

#### `POST /atendimento/mensagens/arquivo`
Upload de arquivo.

**Body**: `multipart/form-data`
- `arquivo`: File
- `ticketId`: string

**Response**:
```json
{
  "id": "uuid",
  "arquivoUrl": "https://cdn.example.com/files/abc123.png",
  "arquivoNome": "screenshot.png",
  "tipo": "imagem"
}
```

---

### Atendentes

#### `GET /atendimento/atendentes`
Listar atendentes.

**Response**:
```json
[
  {
    "id": "uuid",
    "nome": "Maria Santos",
    "email": "maria@empresa.com",
    "online": true,
    "capacidade": 5,
    "atendimentosAtivos": 3
  }
]
```

---

#### `PATCH /atendimento/atendentes/:id/status`
Atualizar status online/offline.

**Body**:
```json
{
  "online": true
}
```

**Response**: `200 OK`

---

## 🔌 WebSocket Events

### Namespace: `/atendimento`

### Eventos de Conexão

#### `connect`
Emitido pelo servidor quando cliente conecta.

**Payload**:
```json
{
  "userId": "uuid",
  "message": "Conectado com sucesso"
}
```

---

#### `disconnect`
Emitido quando cliente desconecta.

---

### Eventos de Ticket

#### `ticket:entrar`
Cliente entra na sala de um ticket.

**Emit**:
```json
{
  "ticketId": "uuid"
}
```

---

#### `ticket:sair`
Cliente sai da sala de um ticket.

**Emit**:
```json
{
  "ticketId": "uuid"
}
```

---

#### `ticket_criado`
Broadcast quando novo ticket é criado.

**Listen**:
```json
{
  "ticket": {
    "id": "uuid",
    "numero": 123,
    "contato_nome": "João Silva",
    "status": "ABERTO"
  }
}
```

---

#### `ticket_atribuido`
Emitido quando ticket é atribuído.

**Listen**:
```json
{
  "ticketId": "uuid",
  "atendente": {
    "id": "uuid",
    "nome": "Maria Santos"
  }
}
```

---

### Eventos de Mensagem

#### `mensagem:enviar`
Cliente envia mensagem.

**Emit**:
```json
{
  "ticketId": "uuid",
  "conteudo": "Olá!",
  "tipo": "texto"
}
```

---

#### `nova_mensagem`
Broadcast quando nova mensagem é enviada.

**Listen**:
```json
{
  "id": "uuid",
  "conteudo": "Olá!",
  "tipo": "texto",
  "direcao": "enviada",
  "remetenteId": "uuid",
  "ticketId": "uuid",
  "createdAt": "2025-12-11T10:00:00Z"
}
```

---

#### `usuario:digitando`
Cliente notifica que está digitando.

**Emit**:
```json
{
  "ticketId": "uuid",
  "nome": "Maria Santos"
}
```

---

#### `usuario_digitando`
Broadcast para outros usuários da sala.

**Listen**:
```json
{
  "userId": "uuid",
  "nome": "Maria Santos"
}
```

---

## 💾 Entities

### Ticket Entity

```typescript
@Entity('atendimento_tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: number;

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

  @Column()
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
}
```

### Mensagem Entity

```typescript
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

---

## 🔧 Services

### TicketService

```typescript
@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async criar(dto: CreateTicketDto): Promise<Ticket>
  async listar(filtros: any): Promise<Ticket[]>
  async buscarPorId(id: string): Promise<Ticket>
  async atualizar(id: string, dto: UpdateTicketDto): Promise<Ticket>
  async atribuir(ticketId: string, atendenteId: string): Promise<Ticket>
  async transferir(ticketId: string, dto: TransferTicketDto): Promise<Ticket>
  async encerrar(ticketId: string): Promise<Ticket>
}
```

### MensagemService

```typescript
@Injectable()
export class MensagemService {
  async criar(dto: CreateMensagemDto): Promise<Mensagem>
  async listarPorTicket(ticketId: string, page: number, limit: number): Promise<Mensagem[]>
  async marcarComoLida(mensagemId: string): Promise<Mensagem>
  async uploadArquivo(file: Express.Multer.File, ticketId: string): Promise<Mensagem>
}
```

### DistribuicaoService

```typescript
@Injectable()
export class DistribuicaoService {
  async distribuirTicket(ticket: Ticket): Promise<Atendente>
  async calcularProximoAtendente(filaId: string): Promise<Atendente>
  async balancearCarga(): Promise<void>
}
```

---

## 📬 Filas de Processamento (Bull)

### WhatsApp Queue

**Queue Name**: `whatsapp`

**Jobs**:
- `enviar_mensagem`: Enviar mensagem via WhatsApp API
- `enviar_arquivo`: Enviar arquivo via WhatsApp API
- `processar_webhook`: Processar webhook recebido do WhatsApp

**Configuração**:
```typescript
@InjectQueue('whatsapp')
private whatsappQueue: Queue;

// Adicionar job
await this.whatsappQueue.add('enviar_mensagem', {
  to: '5511999998888',
  message: 'Olá!',
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
});
```

### Notification Queue

**Queue Name**: `notifications`

**Jobs**:
- `enviar_email`: Enviar email via SMTP
- `enviar_push`: Enviar notificação push
- `enviar_sms`: Enviar SMS

---

## 🔐 Autenticação

### JWT Guard

```typescript
// Usar em controllers
@UseGuards(JwtAuthGuard)
@Get('tickets')
async listar(@Request() req) {
  const user = req.user; // { id, email, empresaId }
  // ...
}
```

### WebSocket JWT Guard

```typescript
// Usar em gateways
@UseGuards(WsJwtGuard)
@SubscribeMessage('mensagem:enviar')
async handleEnviar(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
  const user = client.data.user;
  // ...
}
```

---

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration

# Com cobertura
npm run test:cov
```

### Exemplo de Teste

```typescript
describe('TicketService', () => {
  let service: TicketService;
  let repository: Repository<Ticket>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
  });

  it('deve criar ticket', async () => {
    const dto = { contato_nome: 'João', empresaId: '123' };
    const ticket = await service.criar(dto);
    expect(ticket).toBeDefined();
    expect(ticket.status).toBe('ABERTO');
  });
});
```

---

## 📊 Métricas (Prometheus)

### Métricas Expostas

```typescript
// Counter: Total de tickets criados
tickets_criados_total{empresa_id="123", canal="whatsapp"} 150

// Gauge: Tickets abertos atualmente
tickets_abertos{empresa_id="123"} 25

// Histogram: Tempo de primeira resposta
tempo_primeira_resposta_segundos{empresa_id="123"} 45.2

// Counter: Mensagens enviadas
mensagens_enviadas_total{empresa_id="123", tipo="texto"} 500

// Gauge: Atendentes online
atendentes_online{empresa_id="123"} 8
```

### Endpoint de Métricas

```
GET /metrics
```

---

## 🐛 Debugging

### Habilitar Logs de Debug

```bash
# .env
LOG_LEVEL=debug
```

### Usar Logger do NestJS

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  async metodo() {
    this.logger.log('Informação');
    this.logger.warn('Aviso');
    this.logger.error('Erro', stackTrace);
    this.logger.debug('Debug');
  }
}
```

---

## 🚀 Deployment

### Build

```bash
npm run build
```

### Executar em Produção

```bash
NODE_ENV=production node dist/src/main.js
```

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/src/main.js"]
```

---

## 📚 Recursos

- [NestJS Docs](https://docs.nestjs.com/)
- [TypeORM Docs](https://typeorm.io/)
- [Socket.IO Server](https://socket.io/docs/v4/server-api/)
- [Bull Queue](https://docs.bullmq.io/)

---

**Última atualização**: 11 de dezembro de 2025  
**Mantenedor**: Equipe Backend ConectCRM
