# 🔌 PLANO DE INTEGRAÇÃO FRONTEND ↔ BACKEND

## 📊 Status Atual

### ✅ **Backend - O que já existe:**

#### **Tickets Controller** (`ticket.controller.ts`)
```
✅ GET    /api/atendimento/tickets              - Listar tickets (com filtros)
✅ GET    /api/atendimento/tickets/:id          - Buscar ticket por ID
✅ PATCH  /api/atendimento/tickets/:id/status   - Atualizar status
✅ PATCH  /api/atendimento/tickets/:id/atribuir - Atribuir atendente
```

#### **Mensagens Controller** (`mensagem.controller.ts`)
```
✅ GET    /api/atendimento/mensagens             - Listar mensagens de ticket
✅ GET    /api/atendimento/mensagens/:id         - Buscar mensagem por ID
```

#### **Outros Controllers Existentes:**
- `atendentes.controller.ts` - Gerenciamento de atendentes
- `canais.controller.ts` - Gerenciamento de canais
- `contexto-cliente.controller.ts` - Contexto do cliente
- `busca-global.controller.ts` - Busca global
- `whatsapp-webhook.controller.ts` - Webhook WhatsApp

#### **Gateway WebSocket:**
- `atendimento.gateway.ts` - Socket.IO já configurado

---

### ❌ **O que FALTA implementar:**

#### 1. Endpoints Críticos

```typescript
// TICKETS - Faltam
POST   /api/atendimento/tickets                    // Criar novo ticket
POST   /api/atendimento/tickets/:id/transferir    // Transferir ticket
POST   /api/atendimento/tickets/:id/encerrar      // Encerrar ticket
POST   /api/atendimento/tickets/:id/reabrir       // Reabrir ticket

// MENSAGENS - Faltam
POST   /api/atendimento/tickets/:id/mensagens     // Enviar mensagem
POST   /api/atendimento/tickets/:id/mensagens/marcar-lidas  // Marcar como lidas

// CONTATOS - Faltam (todos)
GET    /api/atendimento/contatos/buscar           // Buscar contatos
POST   /api/atendimento/contatos                  // Criar contato
PUT    /api/atendimento/contatos/:id              // Atualizar contato
POST   /api/atendimento/contatos/:id/vincular-cliente  // Vincular cliente

// HISTÓRICO/DEMANDAS/NOTAS - Faltam (todos)
GET    /api/atendimento/contatos/:id/historico   // Histórico
GET    /api/atendimento/contatos/:id/demandas    // Demandas
POST   /api/atendimento/tickets/:id/demandas     // Criar demanda
POST   /api/atendimento/tickets/:id/notas        // Criar nota
GET    /api/atendimento/contatos/:id/notas       // Listar notas
DELETE /api/atendimento/notas/:id                // Excluir nota

// EXTRAS - Faltam
GET    /api/atendimento/atendentes                // Listar atendentes (pode já existir)
GET    /api/atendimento/templates                 // Templates de mensagens
GET    /api/atendimento/estatisticas              // Estatísticas
```

---

## 🎯 **ESTRATÉGIA DE IMPLEMENTAÇÃO**

### **Opção A: Integração Mínima (MVP - 2h)**
Conectar apenas o essencial para fazer funcionar:

1. ✅ Ajustar frontend para usar endpoints existentes
2. ✅ Criar endpoints críticos faltantes:
   - POST criar ticket
   - POST enviar mensagem
   - POST transferir
   - POST encerrar
3. ✅ Configurar WebSocket básico
4. ⚠️ Deixar features avançadas com mock

**Resultado**: Sistema funcional básico (listar, criar, enviar mensagens)

---

### **Opção B: Integração Completa (8-10h)**
Implementar TODOS os endpoints:

1. ✅ Todos os endpoints de Tickets
2. ✅ Todos os endpoints de Mensagens
3. ✅ CRUD completo de Contatos
4. ✅ Sistema de Demandas
5. ✅ Sistema de Notas
6. ✅ Templates e Estatísticas
7. ✅ WebSocket completo
8. ✅ Upload de arquivos

**Resultado**: Sistema 100% funcional

---

## 🚀 **RECOMENDAÇÃO: Opção A (MVP)**

### **Implementação Imediata (2h)**

#### **1. Criar Endpoints Mínimos** (1h)

**Arquivo**: `backend/src/modules/atendimento/controllers/ticket.controller.ts`

```typescript
// Adicionar ao TicketController existente:

@Post()
async criar(@Body() dadosTicket: CriarTicketDto) {
  return await this.ticketService.criar(dadosTicket);
}

@Post(':id/transferir')
async transferir(
  @Param('id') id: string,
  @Body() dados: TransferirTicketDto
) {
  return await this.ticketService.transferir(id, dados);
}

@Post(':id/encerrar')
async encerrar(
  @Param('id') id: string,
  @Body() dados: EncerrarTicketDto
) {
  return await this.ticketService.encerrar(id, dados);
}
```

**Arquivo**: `backend/src/modules/atendimento/controllers/mensagem.controller.ts`

```typescript
// Adicionar ao MensagemController existente:

@Post()
@UseInterceptors(FileInterceptor('anexos'))
async enviar(
  @Body() dados: EnviarMensagemDto,
  @UploadedFile() anexo?: Express.Multer.File
) {
  return await this.mensagemService.enviar(dados, anexo);
}
```

#### **2. Ajustar Frontend** (30min)

**Arquivo**: `frontend-web/src/features/atendimento/omnichannel/services/atendimentoService.ts`

```typescript
// Já está pronto! Apenas verificar baseUrl:
private baseUrl = '/api/atendimento';  // ✅ Correto
```

#### **3. Configurar WebSocket** (30min)

**Backend** - Verificar `atendimento.gateway.ts`:
```typescript
@WebSocketGateway({ 
  cors: { origin: '*' },
  namespace: '/atendimento'
})
```

**Frontend** - Ajustar `SocketContext.tsx`:
```typescript
const socketInstance = io(`${API_URL}/atendimento`, {
  auth: { token },
  // ...
});
```

---

## 📝 **TAREFAS IMEDIATAS**

### **Backend (Prioridade 1)**

```
[ ] 1. Adicionar endpoint POST /tickets (criar)
[ ] 2. Adicionar endpoint POST /tickets/:id/transferir
[ ] 3. Adicionar endpoint POST /tickets/:id/encerrar
[ ] 4. Adicionar endpoint POST /tickets/:id/mensagens (enviar)
[ ] 5. Configurar CORS para Socket.IO
[ ] 6. Testar WebSocket com frontend
```

### **Frontend (Prioridade 2)**

```
[ ] 1. Envolver ChatOmnichannel com SocketProvider
[ ] 2. Substituir mockTickets por useAtendimentos
[ ] 3. Substituir mockMensagens por useMensagens
[ ] 4. Testar integração completa
[ ] 5. Implementar notificações toast
```

### **Testes (Prioridade 3)**

```
[ ] 1. Criar ticket e verificar na lista
[ ] 2. Enviar mensagem e receber em tempo real
[ ] 3. Transferir ticket entre atendentes
[ ] 4. Encerrar ticket e verificar mudança de status
[ ] 5. WebSocket: mensagens chegam automaticamente
```

---

## 🎯 **PRÓXIMO PASSO RECOMENDADO**

### **1. Implementar endpoints críticos no backend** (começar agora)

Vou criar os endpoints mínimos necessários:
- POST criar ticket
- POST enviar mensagem
- POST transferir ticket
- POST encerrar ticket

### **2. Testar integração básica**

Depois de implementar os endpoints, testar:
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend  
cd frontend-web
npm start

# Testar no navegador
http://localhost:3000/atendimento
```

---

## 📊 **Mapeamento Frontend ↔ Backend**

### **Frontend Service → Backend Endpoint**

```typescript
// Frontend chama:
atendimentoService.listarTickets({ status: 'aberto' })
// Backend recebe:
GET /api/atendimento/tickets?status=aberto
// ✅ JÁ FUNCIONA

// Frontend chama:
atendimentoService.criarTicket(dados)
// Backend recebe:
POST /api/atendimento/tickets
// ❌ PRECISA IMPLEMENTAR

// Frontend chama:
atendimentoService.enviarMensagem({ ticketId, conteudo })
// Backend recebe:
POST /api/atendimento/tickets/:id/mensagens
// ❌ PRECISA IMPLEMENTAR
```

---

## 🔥 **DECISÃO NECESSÁRIA**

Qual opção você prefere?

**A) MVP Rápido (2h)** - Implementar só o essencial, sistema funcionando hoje
**B) Completo (10h)** - Implementar tudo, sistema 100% em 1-2 dias

**Recomendo: Opção A agora, Opção B depois**

Posso começar implementando os 4 endpoints críticos agora mesmo! 🚀
